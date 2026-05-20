import { createScriptPrisma, filterManifest, loadManifest, parseImageArgs } from "./image-shared";

async function main() {
  const options = parseImageArgs();
  const manifest = await loadManifest();
  const entries = filterManifest(manifest.entries, options).filter(
    (entry) => entry.type === "menu" || entry.type === "gift-card"
  );
  const prisma = createScriptPrisma();
  let menuUpdated = 0;
  let giftCardsUpdated = 0;

  try {
    console.log(`Applying image paths for ${entries.length} database record(s)...`);

    for (const entry of entries) {
      const target = entry.dbFieldTarget;

      if (target?.model === "MenuItem") {
        await prisma.menuItem.update({
          where: { id: target.id },
          data: { imageUrl: entry.publicPath }
        });
        menuUpdated += 1;
      } else if (entry.type === "menu") {
        await prisma.menuItem.update({
          where: { slug: entry.slug },
          data: { imageUrl: entry.publicPath }
        });
        menuUpdated += 1;
      }

      if (target?.model === "GiftCardTemplate") {
        await prisma.giftCardTemplate.update({
          where: { id: target.id },
          data: { imageUrl: entry.publicPath }
        });
        giftCardsUpdated += 1;
      } else if (entry.type === "gift-card") {
        await prisma.giftCardTemplate.update({
          where: { name: entry.name },
          data: { imageUrl: entry.publicPath }
        });
        giftCardsUpdated += 1;
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log({
    menuUpdated,
    giftCardsUpdated
  });
}

main().catch((error) => {
  console.error("Applying image paths failed:", error);
  process.exit(1);
});
