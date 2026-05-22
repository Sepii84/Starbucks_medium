import fs from "node:fs/promises";
import path from "node:path";
import * as nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

export type NamedImageKind = "menu-item" | "gift-card";

export type NamedImageManifestEntry = {
  entryNumber: number;
  displayName: string;
  kind: NamedImageKind;
  fileName: string;
  relativePathInZip: string;
  targetPublicPath: string;
  duplicateOccurrence: number;
  note: string;
};

export type NamedImageManifest = {
  totalDatabaseEntries: number;
  uniqueImageFiles: number;
  menuDatabaseEntries: number;
  giftCardDatabaseEntries: number;
  uniqueMenuImageFiles: number;
  uniqueGiftCardImageFiles: number;
  namingRule: string;
  entries: NamedImageManifestEntry[];
};

export const namedManifestPath = path.join(
  process.cwd(),
  "public",
  "images",
  "named-product-manifest.json"
);

export const namedManifestFallbackPath = path.join(
  process.cwd(),
  "generated-assets",
  "named-product-images",
  "starbucks_named_product_images",
  "manifest.json"
);

export const placeholderPatterns = [
  "placeholder-drink",
  "placeholder-food",
  "placeholder-coffee-bag",
  "images.unsplash.com",
  "/placeholder",
  "placeholder-"
];

export async function loadNamedImageManifest() {
  const manifestFile = (await fileExists(namedManifestPath))
    ? namedManifestPath
    : namedManifestFallbackPath;
  const manifest = JSON.parse(await fs.readFile(manifestFile, "utf8")) as NamedImageManifest;

  return {
    manifest,
    manifestFile
  };
}

export function buildNamedImageMaps(manifest: NamedImageManifest) {
  const menu = new Map<string, NamedImageManifestEntry>();
  const giftCardsByDisplayName = new Map<string, NamedImageManifestEntry>();
  const giftCardsByAmount = new Map<number, NamedImageManifestEntry>();

  for (const entry of manifest.entries) {
    if (entry.kind === "menu-item" && !menu.has(entry.displayName)) {
      menu.set(entry.displayName, entry);
    }

    if (entry.kind === "gift-card") {
      giftCardsByDisplayName.set(normalizeGiftCardName(entry.displayName), entry);
      const amount = amountFromGiftCardName(entry.displayName);
      if (amount !== null) {
        giftCardsByAmount.set(amount, entry);
      }
    }
  }

  return {
    menu,
    giftCardsByDisplayName,
    giftCardsByAmount
  };
}

export async function existingManifestFiles(manifest: NamedImageManifest) {
  const missingFiles: string[] = [];

  for (const entry of manifest.entries) {
    if (!(await fileExists(publicPathToFilePath(entry.targetPublicPath)))) {
      missingFiles.push(entry.targetPublicPath);
    }
  }

  return missingFiles;
}

export function publicPathToFilePath(publicPath: string) {
  return path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
}

export async function fileExists(filePath: string) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

export function isLocalPublicImagePath(value: string) {
  return /^\/images\/(?:menu|gift-cards)\/.+\.(?:jpg|jpeg|png|webp)$/i.test(value);
}

export function containsPlaceholder(value: string) {
  return placeholderPatterns.some((pattern) => value.toLowerCase().includes(pattern.toLowerCase()));
}

export function normalizeGiftCardName(value: string) {
  return value
    .toLowerCase()
    .replace(/\$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function amountFromGiftCardName(value: string) {
  const match = value.match(/\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  return Number(match[0]);
}
