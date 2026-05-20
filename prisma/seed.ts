import { PrismaClient, Role } from "@prisma/client";
import * as nextEnv from "@next/env";
import bcrypt from "bcryptjs";
import { pathToFileURL } from "node:url";

nextEnv.loadEnvConfig(process.cwd());

const seedDatabaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const prisma = new PrismaClient(
  seedDatabaseUrl
    ? {
        datasources: {
          db: {
            url: seedDatabaseUrl
          }
        }
      }
    : undefined
);

export type MenuSeedCategory = {
  category: string;
  items: string[];
};

export const MENU_DATA: MenuSeedCategory[] = [
  {
    category: "Featured Summer Menu",
    items: [
      "Tropical Butterfly Lemonade Refresher",
      "Butterfly Drink",
      "Horchata Frappuccino Blended Beverage",
      "Iced Horchata Shaken Espresso",
      "Mango Dragonfruit Energy Refresher",
      "Strawberry Acai Energy Refresher",
      "Toasted Coconut Cream Cold Brew",
      "Iced Brown Sugar Oatmilk Shaken Espresso",
      "Jalapeno Chicken Pocket",
      "Tomato & Mozzarella on Focaccia",
      "Unicorn Cake Pop"
    ]
  },
  {
    category: "Protein Beverages",
    items: [
      "Iced Vanilla Protein Latte",
      "Vanilla Protein Latte",
      "Iced Protein Matcha",
      "Protein Matcha"
    ]
  },
  {
    category: "Hot Coffee",
    items: [
      "Featured Blonde Roast",
      "Pike Place Roast",
      "Dark Roast Coffee",
      "Caffe Misto",
      "Caffe Americano",
      "Caffe Latte",
      "Cappuccino",
      "Espresso",
      "Espresso Macchiato",
      "Flat White",
      "Cortado",
      "Caramel Macchiato",
      "Caffe Mocha",
      "White Chocolate Mocha",
      "Starbucks Blonde Vanilla Latte",
      "Coffee Traveler - Veranda Blend",
      "Coffee Traveler - Pike Place Roast",
      "Coffee Traveler - Dark Roast",
      "Coffee Traveler - Decaf Pike Place Roast"
    ]
  },
  {
    category: "Cold Coffee",
    items: [
      "Cold Brew",
      "Vanilla Sweet Cream Cold Brew",
      "Nondairy Vanilla Sweet Cream Cold Brew",
      "Salted Caramel Cream Cold Brew",
      "Nondairy Salted Caramel Cream Cold Brew",
      "Cold Brew with Nondairy Vanilla Sweet Cream Cold Foam",
      "Chocolate Cream Cold Brew",
      "Nondairy Chocolate Cream Cold Brew",
      "Pistachio Cream Cold Brew",
      "Nitro Cold Brew",
      "Vanilla Sweet Cream Nitro Cold Brew",
      "Iced Coffee",
      "Iced Coffee with Milk",
      "Iced Espresso",
      "Iced Caffe Americano",
      "Iced Caffe Latte",
      "Iced Starbucks Blonde Vanilla Latte",
      "Iced Caramel Macchiato",
      "Iced Caffe Mocha",
      "Iced White Chocolate Mocha",
      "Iced Shaken Espresso",
      "Iced Brown Sugar Oatmilk Shaken Espresso",
      "Iced Hazelnut Oatmilk Shaken Espresso",
      "Iced Horchata Shaken Espresso",
      "Iced Flat White",
      "Iced Lavender Oatmilk Latte"
    ]
  },
  {
    category: "Matcha",
    items: [
      "Matcha Latte",
      "Iced Matcha Latte",
      "Iced Double Berry Matcha",
      "Iced Banana Bread Matcha",
      "Protein Matcha",
      "Iced Protein Matcha",
      "Iced Lavender Cream Oatmilk Matcha"
    ]
  },
  {
    category: "Hot Tea",
    items: [
      "Chai Latte",
      "Earl Grey Tea",
      "Royal English Breakfast Tea",
      "Emperor's Clouds & Mist Tea",
      "Mint Majesty Tea",
      "Peach Tranquility Tea",
      "Chamomile Mint Blossom Tea",
      "Honey Citrus Mint Tea"
    ]
  },
  {
    category: "Cold Tea",
    items: [
      "Iced Chai Latte",
      "Iced Matcha Latte",
      "Iced Black Tea",
      "Iced Black Tea Lemonade",
      "Iced Green Tea",
      "Iced Green Tea Lemonade",
      "Iced Passion Tango Tea",
      "Iced Passion Tango Tea Lemonade"
    ]
  },
  {
    category: "Refreshers",
    items: [
      "Tropical Butterfly Refresher",
      "Tropical Butterfly Lemonade Refresher",
      "Butterfly Drink",
      "Strawberry Acai Refresher",
      "Strawberry Acai Lemonade Refresher",
      "Pink Drink",
      "Mango Dragonfruit Refresher",
      "Mango Dragonfruit Lemonade Refresher",
      "Dragon Drink",
      "Mango Strawberry Refresher",
      "Mango Strawberry Lemonade Refresher",
      "Mango Dream Energy Drink",
      "Mango Dragonfruit Energy Refresher",
      "Mango Dragonfruit Lemonade Energy Refresher",
      "Strawberry Acai Energy Refresher",
      "Strawberry Acai Lemonade Energy Refresher",
      "Cannon Ball Drink"
    ]
  },
  {
    category: "Frappuccino Blended Beverage",
    items: [
      "Coffee Frappuccino Blended Beverage",
      "Espresso Frappuccino Blended Beverage",
      "Caramel Frappuccino Blended Beverage",
      "Mocha Frappuccino Blended Beverage",
      "Java Chip Frappuccino Blended Beverage",
      "White Chocolate Mocha Frappuccino Blended Beverage",
      "Mocha Cookie Crumble Frappuccino Blended Beverage",
      "Caramel Ribbon Crunch Frappuccino Blended Beverage",
      "Horchata Frappuccino Blended Beverage",
      "Strawberry Shortcake Frappuccino Blended Beverage",
      "Vanilla Bean Creme Frappuccino Blended Beverage",
      "Horchata Creme Frappuccino Blended Beverage",
      "Lavender Creme Frappuccino Blended Beverage",
      "Matcha Creme Frappuccino Blended Beverage",
      "Chai Creme Frappuccino Blended Beverage",
      "Strawberry Creme Frappuccino Blended Beverage",
      "Chocolate Cookie Crumble Creme Frappuccino Blended Beverage",
      "Caramel Ribbon Crunch Creme Frappuccino Blended Beverage",
      "Double Chocolaty Chip Creme Frappuccino Blended Beverage",
      "White Chocolate Creme Frappuccino Blended Beverage"
    ]
  },
  {
    category: "Hot Chocolate, Lemonade & More",
    items: [
      "Hot Chocolate",
      "White Hot Chocolate",
      "Caramel Apple Spice",
      "Lemonade",
      "Blended Strawberry Lemonade",
      "Steamed Apple Juice",
      "Vanilla Creme"
    ]
  },
  {
    category: "Bottled Beverages",
    items: [
      "Ethos Bottled Water",
      "Spindrift Raspberry Lime Sparkling Water",
      "Spindrift Grapefruit Sparkling Water",
      "Koia Vanilla Bean Protein Shake",
      "Horizon Organic Lowfat Milk",
      "Horizon Organic Chocolate Milk",
      "Evolution Fresh Organic Defense Up",
      "Evolution Fresh Orange",
      "Evolution Fresh Mighty Watermelon",
      "Sol-ti Ginger SuperShot"
    ]
  },
  {
    category: "Breakfast",
    items: [
      "Bacon, Gouda & Egg Sandwich",
      "Double-Smoked Bacon, Cheddar & Egg Sandwich",
      "Sausage, Cheddar & Egg Sandwich",
      "Spinach, Feta & Egg White Wrap",
      "Impossible Breakfast Sandwich",
      "Turkey Bacon, Cheddar & Egg White Sandwich",
      "Bacon & Gruyere Egg Bites",
      "Egg White & Roasted Red Pepper Egg Bites",
      "Kale & Mushroom Egg Bites",
      "Truffle, Mushroom & Brie Egg Bites",
      "Potato, Cheddar & Chive Bakes",
      "Avocado Spread"
    ]
  },
  {
    category: "Bakery",
    items: [
      "Butter Croissant",
      "Chocolate Croissant",
      "Ham & Swiss Croissant",
      "Cheese Danish",
      "Cookie Croissant Swirl",
      "Yuzu Citrus Blossom",
      "Blueberry Muffin",
      "Petite Vanilla Bean Scone",
      "Cinnamon Coffee Cake",
      "Banana Walnut & Pecan Loaf",
      "Iced Lemon Loaf",
      "Pumpkin & Pepita Loaf",
      "Chocolate Chip Cookie",
      "Marshmallow Dream Bar",
      "Everything Bagel",
      "Plain Bagel"
    ]
  },
  {
    category: "Treats",
    items: [
      "Unicorn Cake Pop",
      "Frog Cake Pop",
      "Birthday Cake Pop",
      "Chocolate Cake Pop",
      "Cookies & Cream Cake Pop",
      "Double Chocolate Brownie",
      "Chocolate Chip Cookie",
      "Marshmallow Dream Bar",
      "Madeleines",
      "Vanilla Biscotti with Almonds",
      "Dark Chocolate Covered Espresso Beans",
      "Dark Chocolate Grahams"
    ]
  },
  {
    category: "Lunch",
    items: [
      "Tomato & Mozzarella on Focaccia",
      "Jalapeno Chicken Pocket",
      "Crispy Grilled Cheese on Sourdough",
      "Turkey, Provolone & Pesto on Ciabatta",
      "Ham & Swiss on Baguette",
      "Egg, Pesto & Mozzarella Sandwich",
      "PB&J Protein Box",
      "Cheese & Fruit Protein Box",
      "Cheddar & Uncured Salami Protein Box",
      "Eggs & Gouda Protein Box"
    ]
  },
  {
    category: "At Home Coffee - Whole Bean",
    items: [
      "Starbucks Sunsera Blend",
      "Veranda Blend",
      "Pike Place Roast Whole Bean",
      "House Blend Whole Bean",
      "Caffe Verona Whole Bean",
      "Espresso Roast Whole Bean",
      "Italian Roast Whole Bean",
      "Komodo Dragon Blend Whole Bean",
      "Sumatra Whole Bean",
      "Decaf Pike Place Roast Whole Bean",
      "Siren's Blend Whole Bean",
      "Green Apron Blend Whole Bean"
    ]
  },
  {
    category: "At Home Coffee - VIA Instant",
    items: [
      "VIA Instant Pike Place Roast",
      "VIA Instant Italian Roast",
      "VIA Instant Veranda Blend",
      "VIA Instant Decaf Italian Roast",
      "VIA Instant Sweetened Iced Coffee"
    ]
  }
];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function deterministicHash(value: string): number {
  return [...value].reduce((hash, char) => hash + char.charCodeAt(0), 0);
}

function priceRangeForCategory(category: string): [number, number] {
  if (category === "Featured Summer Menu") return [6.45, 7.45];
  if (category === "Hot Coffee") return [3.25, 6.25];
  if (category === "Cold Coffee") return [4.25, 7.25];
  if (category === "Matcha" || category === "Protein Beverages") return [5.25, 7.25];
  if (category === "Hot Tea" || category === "Cold Tea") return [3.25, 5.95];
  if (category === "Refreshers") return [4.95, 7.45];
  if (category === "Frappuccino Blended Beverage") return [5.75, 7.95];
  if (category === "Bottled Beverages") return [2.5, 5.95];
  if (category === "Breakfast") return [4.25, 7.95];
  if (category === "Bakery") return [2.95, 5.95];
  if (category === "Treats") return [2.75, 5.45];
  if (category === "Lunch") return [6.45, 9.95];
  if (category.startsWith("At Home Coffee")) return [8.95, 17.95];

  return [4.25, 7.25];
}

function placeholderPrice(name: string, category: string): number {
  const [min, max] = priceRangeForCategory(category);
  const centsMin = Math.round(min * 100);
  const centsMax = Math.round(max * 100);
  const steps = Math.max(1, Math.floor((centsMax - centsMin) / 25));
  const cents = centsMin + (deterministicHash(`${category}:${name}`) % (steps + 1)) * 25;

  return Number((cents / 100).toFixed(2));
}

export function itemSlug(name: string, category: string, nameCounts: Map<string, number>): string {
  const baseSlug = slugify(name);

  if ((nameCounts.get(baseSlug) ?? 0) <= 1) {
    return baseSlug;
  }

  return `${baseSlug}-${slugify(category)}`;
}

function categoryDescription(category: string): string {
  return `${category} selections for the Starbucks Medium demo menu.`;
}

async function seedUsers() {
  const [adminPassword, userPassword] = await Promise.all([
    bcrypt.hash("Admin123!", 12),
    bcrypt.hash("User123!", 12)
  ]);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      name: "Starbucks Admin",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      isActive: true
    },
    create: {
      name: "Starbucks Admin",
      email: "admin@example.com",
      passwordHash: adminPassword,
      role: Role.ADMIN
    }
  });

  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {
      name: "Sepehr",
      passwordHash: userPassword,
      role: Role.USER,
      rewardPoints: 250,
      walletBalance: 100,
      isActive: true
    },
    create: {
      name: "Sepehr",
      email: "user@example.com",
      passwordHash: userPassword,
      role: Role.USER,
      rewardPoints: 250,
      walletBalance: 100,
      phone: "+1 (206) 555-0199",
      address: "42 Greenhouse Lane, Seattle, WA"
    }
  });
}

function getMenuNameCounts() {
  const nameCounts = new Map<string, number>();

  for (const group of MENU_DATA) {
    for (const name of group.items) {
      const slug = slugify(name);
      nameCounts.set(slug, (nameCounts.get(slug) ?? 0) + 1);
    }
  }

  return nameCounts;
}

async function seedMenuCategories() {
  const categoryRecords = new Map<string, string>();

  for (const group of MENU_DATA) {
    console.log(`  Upserting category: ${group.category}`);
    const category = await prisma.menuCategory.upsert({
      where: { slug: slugify(group.category) },
      update: {
        name: group.category,
        description: categoryDescription(group.category)
      },
      create: {
        name: group.category,
        slug: slugify(group.category),
        description: categoryDescription(group.category)
      }
    });

    categoryRecords.set(group.category, category.id);
  }

  return categoryRecords;
}

async function seedMenuItems(categoryRecords: Map<string, string>) {
  const nameCounts = getMenuNameCounts();

  for (const group of MENU_DATA) {
    const categoryId = categoryRecords.get(group.category);

    if (!categoryId) {
      throw new Error(`Missing category ${group.category}`);
    }

    console.log(`  Upserting ${group.items.length} menu items for ${group.category}...`);

    for (const name of group.items) {
      const slug = itemSlug(name, group.category, nameCounts);
      const isFeatured = group.category === "Featured Summer Menu";

      await prisma.menuItem.upsert({
        where: { slug },
        update: {
          name,
          description: `${name} from the ${group.category} menu.`,
          price: placeholderPrice(name, group.category),
          imageUrl: `/images/menu/${slug}.png`,
          categoryId,
          isAvailable: true,
          isFeatured
        },
        create: {
          name,
          slug,
          description: `${name} from the ${group.category} menu.`,
          price: placeholderPrice(name, group.category),
          imageUrl: `/images/menu/${slug}.png`,
          categoryId,
          isAvailable: true,
          isFeatured
        }
      });
    }
  }
}

async function seedSiteInfo() {
  const existingSiteInfo = await prisma.siteInfo.findFirst();
  const data = {
    aboutText:
      "Starbucks Medium is a futuristic luxury coffee sanctuary inspired by botanical craft, precise brewing, and the calm glow of a late-night espresso bar. We serve classic drinks, luminous matcha, cold brews, and desserts with hospitality that feels personal.",
    footerDescription:
      "Dark luxury coffee, botanical drinks, online ordering, and calm neon hospitality.",
    address: "118 Emerald Ave, Seattle, WA 98101",
    phone: "+1 (206) 555-0147",
    email: "hello@starbucksmedium.local",
    openingHours: "Mon-Sun 7:00 AM - 10:00 PM",
    instagramUrl: "https://instagram.com/starbucksmedium",
    twitterUrl: "https://twitter.com/starbucksmedium",
    mapUrl: "https://maps.google.com"
  };

  if (existingSiteInfo) {
    await prisma.siteInfo.update({
      where: { id: existingSiteInfo.id },
      data
    });
  } else {
    await prisma.siteInfo.create({ data });
  }
}

const REWARD_RULES = [
  { itemName: "Caffe Latte", pointsRequired: 100 },
  { itemName: "Cold Brew", pointsRequired: 120 },
  { itemName: "Caramel Macchiato", pointsRequired: 150 },
  { itemName: "Iced Matcha Latte", pointsRequired: 160 },
  { itemName: "Java Chip Frappuccino", pointsRequired: 180 }
];

export const GIFT_CARD_TEMPLATES = [
  { name: "$10 Gift Card", amount: 10 },
  { name: "$25 Gift Card", amount: 25 },
  { name: "$50 Gift Card", amount: 50 },
  { name: "$100 Gift Card", amount: 100 }
];

async function seedRewards() {
  const menuItems = await prisma.menuItem.findMany();

  for (const rule of REWARD_RULES) {
    console.log(`  Upserting reward rule: ${rule.itemName} (${rule.pointsRequired} pts)`);
    const targetSlug = slugify(rule.itemName);
    const item =
      menuItems.find((menuItem) => menuItem.slug === targetSlug) ??
      menuItems.find((menuItem) =>
        menuItem.name.toLowerCase().includes(rule.itemName.toLowerCase())
      );

    if (!item) {
      console.warn(`Skipping reward rule. Menu item not found: ${rule.itemName}`);
      continue;
    }

    await prisma.rewardRule.upsert({
      where: { menuItemId: item.id },
      update: {
        pointsRequired: rule.pointsRequired,
        isActive: true
      },
      create: {
        menuItemId: item.id,
        pointsRequired: rule.pointsRequired,
        isActive: true
      }
    });
  }
}

async function seedGiftCards() {
  for (const template of GIFT_CARD_TEMPLATES) {
    console.log(`  Upserting gift card template: ${template.name}`);
    await prisma.giftCardTemplate.upsert({
      where: { name: template.name },
      update: {
        description: `${template.name} for Starbucks Medium wallet gifting.`,
        amount: template.amount,
        imageUrl: `/images/gift-cards/${template.amount}-dollar-gift-card.png`,
        isActive: true
      },
      create: {
        name: template.name,
        description: `${template.name} for Starbucks Medium wallet gifting.`,
        amount: template.amount,
        imageUrl: `/images/gift-cards/${template.amount}-dollar-gift-card.png`,
        isActive: true
      }
    });
  }
}

async function connectWithRetry() {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await prisma.$connect();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
  }

  throw lastError;
}

async function main() {
  console.log("Starting seed...");
  console.log("Connecting to database...");
  console.log(
    process.env.DIRECT_URL
      ? "Using DIRECT_URL for seed setup connection."
      : "Using DATABASE_URL for seed setup connection."
  );
  await connectWithRetry();

  console.log("Seeding users...");
  await seedUsers();

  console.log("Seeding menu categories...");
  const categoryRecords = await seedMenuCategories();

  console.log("Seeding menu items...");
  await seedMenuItems(categoryRecords);

  console.log("Seeding site info...");
  await seedSiteInfo();

  console.log("Seeding reward rules...");
  await seedRewards();

  console.log("Seeding gift card templates...");
  await seedGiftCards();

  console.log("Counting seeded records...");
  const userCount = await prisma.user.count();
  const categoryCount = await prisma.menuCategory.count();
  const itemCount = await prisma.menuItem.count();
  const featuredItemCount = await prisma.menuItem.count({
    where: { isFeatured: true }
  });
  const rewardRuleCount = await prisma.rewardRule.count();
  const giftCardTemplateCount = await prisma.giftCardTemplate.count();

  if (itemCount === 0) {
    throw new Error("Seed completed with 0 menu items. Check the menu seed data.");
  }

  console.log("Seed completed successfully.");
  console.log({
    userCount,
    categoryCount,
    itemCount,
    featuredItemCount,
    rewardRuleCount,
    giftCardTemplateCount
  });
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  main()
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      console.log("Disconnecting Prisma...");
      await prisma.$disconnect();
      console.log("Prisma disconnected.");
    });
} else {
  prisma.$disconnect().catch(() => {
    // Importing seed data for tooling should not keep a Prisma connection open.
  });
}
