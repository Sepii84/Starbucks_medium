import { Prisma } from "@prisma/client";
import { createScriptPrisma } from "./image-shared";
import {
  amountFromGiftCardName,
  buildNamedImageMaps,
  existingManifestFiles,
  loadNamedImageManifest,
  normalizeGiftCardName
} from "./named-image-utils";

const prisma = createScriptPrisma();

async function main() {
  const { manifest, manifestFile } = await loadNamedImageManifest();
  const missingFiles = await existingManifestFiles(manifest);

  if (missingFiles.length) {
    console.error("Named image files are missing from public/.");
    console.error(missingFiles);
    process.exitCode = 1;
    return;
  }

  const maps = buildNamedImageMaps(manifest);
  const [menuItems, giftCardTemplates] = await runWithRetry("load database image targets", () =>
    Promise.all([
      prisma.menuItem.findMany({ select: { id: true, name: true } }),
      prisma.giftCardTemplate.findMany({ select: { id: true, name: true, amount: true } })
    ])
  );

  const databaseMenuNames = new Set(menuItems.map((item) => item.name));
  const unmatchedDatabaseItems = [...databaseMenuNames]
    .filter((name) => !maps.menu.has(name))
    .sort();
  const manifestMenuNames = new Set(maps.menu.keys());
  const manifestMenuNamesWithoutDb = [...manifestMenuNames]
    .filter((name) => !databaseMenuNames.has(name))
    .sort();

  let menuRecordsUpdated = 0;
  let giftCardTemplatesUpdated = 0;

  console.log(`Updating menu image paths for ${maps.menu.size} manifest product name(s)...`);
  const menuRows = [...maps.menu].map(([name, entry]) =>
    Prisma.sql`(${name}, ${entry.targetPublicPath})`
  );

  if (menuRows.length) {
    menuRecordsUpdated = await runWithRetry("bulk update menu image paths", () =>
      prisma.$executeRaw`
        UPDATE "MenuItem" AS menu_item
        SET "imageUrl" = image_values."imageUrl"
        FROM (VALUES ${Prisma.join(menuRows)}) AS image_values("name", "imageUrl")
        WHERE menu_item."name" = image_values."name"
      `
    );
  }

  const unmatchedGiftCardTemplates: string[] = [];
  const giftCardRows = [...maps.giftCardsByAmount].map(([amount, entry]) =>
    Prisma.sql`(${amount}, ${entry.targetPublicPath})`
  );

  for (const template of giftCardTemplates) {
    const amount = Number(template.amount);
    const byAmount = maps.giftCardsByAmount.get(amount);
    const byName = maps.giftCardsByDisplayName.get(normalizeGiftCardName(template.name));
    const entry = byAmount ?? byName;

    if (!entry) {
      unmatchedGiftCardTemplates.push(`${template.name} (${amount})`);
      continue;
    }

  }

  console.log(`Updating ${giftCardTemplates.length} gift-card template image path(s)...`);
  if (giftCardRows.length) {
    giftCardTemplatesUpdated = await runWithRetry("bulk update gift-card image paths", () =>
      prisma.$executeRaw`
        UPDATE "GiftCardTemplate" AS gift_card_template
        SET "imageUrl" = image_values."imageUrl"
        FROM (VALUES ${Prisma.join(giftCardRows)}) AS image_values("amount", "imageUrl")
        WHERE gift_card_template."amount" = image_values."amount"::numeric
      `
    );
  }

  const summary = {
    manifestFile,
    menuRecordsUpdated,
    giftCardTemplatesUpdated,
    missingFiles,
    unmatchedDatabaseItems,
    unmatchedGiftCardTemplates,
    manifestMenuNamesWithoutDb,
    giftCardManifestAmounts: [...maps.giftCardsByAmount.keys()].sort((a, b) => a - b),
    exampleGiftCardMatch: giftCardTemplates[0]
      ? amountFromGiftCardName(giftCardTemplates[0].name)
      : null
  };

  console.log("Named image apply completed.");
  console.log(JSON.stringify(summary, null, 2));
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
    console.error("Applying named images failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
