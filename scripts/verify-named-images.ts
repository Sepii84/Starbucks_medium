import { createScriptPrisma } from "./image-shared";
import {
  buildNamedImageMaps,
  containsPlaceholder,
  existingManifestFiles,
  fileExists,
  isLocalPublicImagePath,
  loadNamedImageManifest,
  normalizeGiftCardName,
  publicPathToFilePath
} from "./named-image-utils";

const prisma = createScriptPrisma();

async function main() {
  const { manifest, manifestFile } = await loadNamedImageManifest();
  const maps = buildNamedImageMaps(manifest);
  const missingManifestFiles = await existingManifestFiles(manifest);
  const invalidDatabasePaths: string[] = [];
  const placeholderReferences: string[] = [];
  const mismatchedMenuItems: string[] = [];
  const mismatchedGiftCards: string[] = [];

  const [menuItems, giftCardTemplates] = await runWithRetry("load database image paths", () =>
    Promise.all([
      prisma.menuItem.findMany({ select: { name: true, imageUrl: true } }),
      prisma.giftCardTemplate.findMany({ select: { name: true, amount: true, imageUrl: true } })
    ])
  );

  for (const item of menuItems) {
    const expected = maps.menu.get(item.name)?.targetPublicPath;

    if (!(await isValidDatabaseImage(item.imageUrl))) {
      invalidDatabasePaths.push(`MenuItem ${item.name}: ${item.imageUrl}`);
    }

    if (containsPlaceholder(item.imageUrl)) {
      placeholderReferences.push(`MenuItem ${item.name}: ${item.imageUrl}`);
    }

    if (expected && item.imageUrl !== expected) {
      mismatchedMenuItems.push(`MenuItem ${item.name}: expected ${expected}, got ${item.imageUrl}`);
    }

    if (!expected) {
      mismatchedMenuItems.push(`MenuItem ${item.name}: no manifest entry`);
    }
  }

  for (const template of giftCardTemplates) {
    const expected =
      maps.giftCardsByAmount.get(Number(template.amount))?.targetPublicPath ??
      maps.giftCardsByDisplayName.get(normalizeGiftCardName(template.name))?.targetPublicPath;
    const imageUrl = template.imageUrl ?? "";

    if (!(await isValidDatabaseImage(imageUrl))) {
      invalidDatabasePaths.push(`GiftCardTemplate ${template.name}: ${imageUrl}`);
    }

    if (containsPlaceholder(imageUrl)) {
      placeholderReferences.push(`GiftCardTemplate ${template.name}: ${imageUrl}`);
    }

    if (expected && imageUrl !== expected) {
      mismatchedGiftCards.push(
        `GiftCardTemplate ${template.name}: expected ${expected}, got ${imageUrl}`
      );
    }

    if (!expected) {
      mismatchedGiftCards.push(`GiftCardTemplate ${template.name}: no manifest entry`);
    }
  }

  const summary = {
    manifestFile,
    manifestEntries: manifest.entries.length,
    menuRecordsChecked: menuItems.length,
    giftCardTemplatesChecked: giftCardTemplates.length,
    missingManifestFiles,
    invalidDatabasePaths,
    placeholderReferences,
    mismatchedMenuItems,
    mismatchedGiftCards
  };

  console.log("Named image verification completed.");
  console.log(JSON.stringify(summary, null, 2));

  if (
    missingManifestFiles.length ||
    invalidDatabasePaths.length ||
    placeholderReferences.length ||
    mismatchedMenuItems.length ||
    mismatchedGiftCards.length
  ) {
    process.exitCode = 1;
  }
}

async function isValidDatabaseImage(imageUrl: string) {
  return isLocalPublicImagePath(imageUrl) && fileExists(publicPathToFilePath(imageUrl));
}

async function runWithRetry<T>(label: string, action: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`${label} failed on attempt ${attempt}: ${message}`);

      if (attempt < 3) {
        await prisma.$disconnect().catch(() => undefined);
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
        await prisma.$connect().catch(() => undefined);
      }
    }
  }

  throw lastError;
}

main()
  .catch((error) => {
    console.error("Verifying named images failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
