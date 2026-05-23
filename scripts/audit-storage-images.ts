import * as nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

async function main() {
  const shouldDelete = process.argv.includes("--delete");
  const [{ prisma }, storage] = await Promise.all([
    import("../lib/prisma"),
    import("../lib/admin/storage-images")
  ]);
  const {
    deleteManagedStoragePath,
    listManagedStorageFiles,
    parseManagedStorageImage
  } = storage;

  try {
    const [storageFiles, menuItems, giftCardTemplates] = await Promise.all([
      listManagedStorageFiles(),
      prisma.menuItem.findMany({ select: { name: true, imageUrl: true } }),
      prisma.giftCardTemplate.findMany({ select: { name: true, imageUrl: true } })
    ]);

    const referencedPaths = new Set<string>();

    for (const record of [...menuItems, ...giftCardTemplates]) {
      const parsed = parseManagedStorageImage(record.imageUrl);

      if (parsed) {
        referencedPaths.add(parsed.path);
      }
    }

    const orphanFiles = storageFiles.filter((file) => !referencedPaths.has(file.path));

    console.log("Supabase Storage image audit completed.");
    console.log(`Mode: ${shouldDelete ? "delete orphan files" : "read-only audit"}`);
    console.log(`Storage files found: ${storageFiles.length}`);
    console.log(`Database-managed image references: ${referencedPaths.size}`);
    console.log(`Referenced storage files: ${storageFiles.length - orphanFiles.length}`);
    console.log(`Orphan storage files: ${orphanFiles.length}`);

    if (orphanFiles.length) {
      console.log("Orphan files:");
      for (const file of orphanFiles) {
        console.log(`- ${file.path}`);
      }
    }

    if (shouldDelete) {
      for (const file of orphanFiles) {
        const result = await deleteManagedStoragePath(file.path);
        console.log(`${result.deleted ? "Deleted" : "Skipped"} ${file.path}: ${result.reason}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Storage image audit failed:", error);
  process.exit(1);
});
