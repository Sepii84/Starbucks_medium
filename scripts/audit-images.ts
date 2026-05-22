import fs from "node:fs/promises";
import path from "node:path";

type ManifestEntry = {
  targetPublicPath?: string;
};

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const textExtensions = new Set([
  ".css",
  ".json",
  ".md",
  ".prisma",
  ".ts",
  ".tsx"
]);

const scanDirs = ["app", "components", "lib", "prisma", "scripts", "public/images"];
const largeFileBytes = 1_000_000;

async function main() {
  const publicImagesDir = path.join(process.cwd(), "public", "images");
  const imageFiles = await listFiles(publicImagesDir);
  const publicImageFiles = imageFiles
    .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
    .map(toPublicPath)
    .sort();
  const usedPaths = new Set<string>();

  for (const scanDir of scanDirs) {
    const fullDir = path.join(process.cwd(), scanDir);
    const files = await listFiles(fullDir);

    for (const file of files) {
      if (!textExtensions.has(path.extname(file).toLowerCase())) {
        continue;
      }

      const content = await fs.readFile(file, "utf8");
      for (const imagePath of extractImagePaths(content)) {
        usedPaths.add(imagePath);
      }
    }
  }

  await addNamedManifestReferences(usedPaths);

  const missingReferencedFiles = [...usedPaths]
    .filter((publicPath) => isImagePath(publicPath) && !publicImageFiles.includes(publicPath))
    .sort();
  const unusedImageFiles = publicImageFiles
    .filter((publicPath) => !usedPaths.has(publicPath))
    .sort();
  const largeFiles = await largePublicFiles(publicImageFiles);

  const generatedAssetsDir = path.join(process.cwd(), "generated-assets");
  const generatedAssetsExists = await directoryExists(generatedAssetsDir);

  console.log(
    JSON.stringify(
      {
        totalPublicImageFiles: publicImageFiles.length,
        usedImageFiles: publicImageFiles.length - unusedImageFiles.length,
        unusedImageFiles: unusedImageFiles.length,
        missingReferencedFiles,
        largeFiles,
        generatedAssetsExists,
        unused: unusedImageFiles
      },
      null,
      2
    )
  );
}

async function addNamedManifestReferences(usedPaths: Set<string>) {
  const manifestPath = path.join(process.cwd(), "public", "images", "named-product-manifest.json");

  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as {
      entries?: ManifestEntry[];
    };
    usedPaths.add("/images/named-product-manifest.json");

    for (const entry of manifest.entries ?? []) {
      if (entry.targetPublicPath) {
        usedPaths.add(normalizePublicPath(entry.targetPublicPath));
      }
    }
  } catch {
    // The named manifest is optional for the audit script.
  }
}

function extractImagePaths(content: string) {
  const paths = new Set<string>();
  const quotedPathRegex = /["'`]((?:\/images\/)[^"'`]+?\.(?:jpg|jpeg|png|webp|gif|json))["'`]/gi;

  for (const match of content.matchAll(quotedPathRegex)) {
    if (!match[1].includes("${")) {
      paths.add(normalizePublicPath(match[1]));
    }
  }

  return paths;
}

async function largePublicFiles(publicImageFiles: string[]) {
  const results: Array<{ path: string; bytes: number }> = [];

  for (const publicPath of publicImageFiles) {
    const filePath = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
    const stat = await fs.stat(filePath);
    if (stat.size >= largeFileBytes) {
      results.push({ path: publicPath, bytes: stat.size });
    }
  }

  return results.sort((a, b) => b.bytes - a.bytes);
}

async function listFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map((entry) => {
        const fullPath = path.join(dir, entry.name);
        return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
      })
    );
    return files.flat();
  } catch {
    return [];
  }
}

async function directoryExists(dir: string) {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

function toPublicPath(file: string) {
  return normalizePublicPath(
    `/${path.relative(path.join(process.cwd(), "public"), file).replaceAll("\\", "/")}`
  );
}

function normalizePublicPath(value: string) {
  return value.replaceAll("\\", "/").replace(/\/{2,}/g, "/");
}

function isImagePath(value: string) {
  return imageExtensions.has(path.extname(value).toLowerCase());
}

main().catch((error) => {
  console.error("Image audit failed:", error);
  process.exit(1);
});
