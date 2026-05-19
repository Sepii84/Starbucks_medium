import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { slugify } from "../lib/utils";

const image = {
  matcha:
    "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80",
  coldBrew:
    "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=900&q=80",
  latte:
    "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=80",
  cappuccino:
    "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=900&q=80",
  caramel:
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
  cake:
    "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=900&q=80"
};

async function main() {
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
      isActive: true
    },
    create: {
      name: "Sepehr",
      email: "user@example.com",
      passwordHash: userPassword,
      role: Role.USER,
      phone: "+1 (206) 555-0199",
      address: "42 Greenhouse Lane, Seattle, WA"
    }
  });

  const categories = [
    {
      name: "Coffee",
      description: "Classic espresso craft and future-forward roast profiles."
    },
    {
      name: "Matcha",
      description: "Botanical green drinks with soft luminous energy."
    },
    {
      name: "Cold Drinks",
      description: "Chilled brews, sparkling refreshers, and slow-steeped signatures."
    },
    {
      name: "Desserts",
      description: "Small-batch cakes and sweet pairings for the dark bar."
    }
  ];

  const categoryRecords = new Map<string, string>();

  for (const category of categories) {
    const record = await prisma.menuCategory.upsert({
      where: { slug: slugify(category.name) },
      update: category,
      create: {
        ...category,
        slug: slugify(category.name)
      }
    });

    categoryRecords.set(category.name, record.id);
  }

  const items = [
    {
      name: "Emerald Matcha Glow",
      description:
        "Ceremonial matcha, oat cloud, vanilla botanicals, and a soft neon mint finish.",
      price: 6.5,
      imageUrl: image.matcha,
      category: "Matcha"
    },
    {
      name: "Void Cold Brew",
      description:
        "Twenty-hour cold brew with cacao depth, mineral clarity, and a clean dark finish.",
      price: 5.25,
      imageUrl: image.coldBrew,
      category: "Cold Drinks"
    },
    {
      name: "Siren Mist Latte",
      description:
        "Velvet espresso with steamed milk, salted cream mist, and green cardamom.",
      price: 7.15,
      imageUrl: image.latte,
      category: "Coffee"
    },
    {
      name: "Classic Cappuccino",
      description:
        "Balanced espresso, dense microfoam, and a familiar comfort profile.",
      price: 4.95,
      imageUrl: image.cappuccino,
      category: "Coffee"
    },
    {
      name: "Caramel Cloud Latte",
      description:
        "Espresso, caramel silk, oat milk, and a lifted vanilla cloud finish.",
      price: 6.75,
      imageUrl: image.caramel,
      category: "Coffee"
    },
    {
      name: "Chocolate Cake",
      description:
        "Dark chocolate layer cake with espresso ganache and emerald sugar dust.",
      price: 5.95,
      imageUrl: image.cake,
      category: "Desserts"
    }
  ];

  for (const item of items) {
    const categoryId = categoryRecords.get(item.category);

    if (!categoryId) {
      throw new Error(`Missing category ${item.category}`);
    }

    await prisma.menuItem.upsert({
      where: { slug: slugify(item.name) },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        categoryId,
        isAvailable: true
      },
      create: {
        name: item.name,
        slug: slugify(item.name),
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        categoryId,
        isAvailable: true
      }
    });
  }

  const existingSiteInfo = await prisma.siteInfo.findFirst();

  if (existingSiteInfo) {
    await prisma.siteInfo.update({
      where: { id: existingSiteInfo.id },
      data: {
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
      }
    });
  } else {
    await prisma.siteInfo.create({
      data: {
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
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
