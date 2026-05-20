import fs from "node:fs/promises";
import path from "node:path";
import {
  createScriptPrisma,
  fileExists,
  filterManifest,
  loadManifest,
  parseImageArgs,
  publicPathToFilePath,
  saveJson,
  verificationReportPath
} from "./image-shared";

type VerificationReport = {
  generatedAt: string;
  checked: number;
  missingFiles: string[];
  zeroByteFiles: string[];
  invalidDatabasePaths: string[];
  placeholderReferences: string[];
  databaseChecked: boolean;
  databaseError?: string;
};

const placeholderPatterns = [
  "placeholder-drink",
  "placeholder-food",
  "placeholder-coffee-bag",
  "images.unsplash.com"
];

async function main() {
  const options = parseImageArgs();
  const manifest = await loadManifest();
  const entries = filterManifest(manifest.entries, options);
  const prisma = createScriptPrisma();
  const report: VerificationReport = {
    generatedAt: new Date().toISOString(),
    checked: entries.length,
    missingFiles: [],
    zeroByteFiles: [],
    invalidDatabasePaths: [],
    placeholderReferences: [],
    databaseChecked: false
  };

  console.log(`Verifying ${entries.length} image target(s)...`);

  for (const entry of entries) {
    const filePath = publicPathToFilePath(entry.publicPath);

    if (!(await fileExists(filePath))) {
      report.missingFiles.push(entry.publicPath);
      continue;
    }

    const stat = await fs.stat(filePath);
    if (stat.size === 0) {
      report.zeroByteFiles.push(entry.publicPath);
    }
  }

  try {
    const [menuItems, giftCardTemplates] = await Promise.all([
      prisma.menuItem.findMany({ select: { name: true, imageUrl: true } }),
      prisma.giftCardTemplate.findMany({ select: { name: true, imageUrl: true } })
    ]);

    for (const item of menuItems) {
      if (!isValidLocalImagePath(item.imageUrl) || !(await fileExists(publicPathToFilePath(item.imageUrl)))) {
        report.invalidDatabasePaths.push(`MenuItem ${item.name}: ${item.imageUrl}`);
      }
      if (containsPlaceholder(item.imageUrl)) {
        report.placeholderReferences.push(`MenuItem ${item.name}: ${item.imageUrl}`);
      }
    }

    for (const template of giftCardTemplates) {
      const imageUrl = template.imageUrl ?? "";
      if (!isValidLocalImagePath(imageUrl) || !(await fileExists(publicPathToFilePath(imageUrl)))) {
        report.invalidDatabasePaths.push(`GiftCardTemplate ${template.name}: ${imageUrl}`);
      }
      if (containsPlaceholder(imageUrl)) {
        report.placeholderReferences.push(`GiftCardTemplate ${template.name}: ${imageUrl}`);
      }
    }
    report.databaseChecked = true;
  } catch (error) {
    report.databaseError = error instanceof Error ? error.message : "Unknown database error";
    console.warn("Database image verification could not run:", report.databaseError);
  }

  const codeFiles = await listTextFiles([
    path.join(process.cwd(), "app"),
    path.join(process.cwd(), "components"),
    path.join(process.cwd(), "prisma")
  ]);

  for (const file of codeFiles) {
    const content = await fs.readFile(file, "utf8");
    if (placeholderPatterns.some((pattern) => content.includes(pattern))) {
      report.placeholderReferences.push(path.relative(process.cwd(), file).replaceAll("\\", "/"));
    }
  }

  await prisma.$disconnect();

  await saveJson(verificationReportPath, report);

  console.log(report);

  if (
    report.missingFiles.length ||
    report.zeroByteFiles.length ||
    report.invalidDatabasePaths.length ||
    report.placeholderReferences.length ||
    !report.databaseChecked
  ) {
    process.exitCode = 1;
  }
}

function isValidLocalImagePath(value: string) {
  return value.startsWith("/images/") && value.endsWith(".png");
}

function containsPlaceholder(value: string) {
  return placeholderPatterns.some((pattern) => value.includes(pattern));
}

async function listTextFiles(dirs: string[]) {
  const files: string[] = [];

  for (const dir of dirs) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...(await listTextFiles([fullPath])));
        } else if (/\.(ts|tsx|prisma|md)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch {
      // Missing optional directory.
    }
  }

  return files;
}

main().catch((error) => {
  console.error("Image verification failed:", error);
  process.exit(1);
});
