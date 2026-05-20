import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import * as nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

export type ImageTargetType = "menu" | "gift-card" | "site";

export type ImageManifestEntry = {
  type: ImageTargetType;
  id: string;
  name: string;
  slug: string;
  category?: string;
  prompt: string;
  outputPath: string;
  publicPath: string;
  dbFieldTarget?: {
    model: "MenuItem" | "GiftCardTemplate";
    id: string;
    field: "imageUrl";
  };
};

export type ImageManifest = {
  generatedAt: string;
  count: number;
  entries: ImageManifestEntry[];
};

export type ImageScriptOptions = {
  force: boolean;
  limit?: number;
  match?: string;
  only?: Set<ImageTargetType>;
};

export const manifestPath = path.join(process.cwd(), "generated-assets", "image-manifest.json");
export const generationReportPath = path.join(
  process.cwd(),
  "generated-assets",
  "image-generation-report.json"
);
export const verificationReportPath = path.join(
  process.cwd(),
  "generated-assets",
  "image-verification-report.json"
);
export const zipPath = path.join(process.cwd(), "generated-assets", "product-images.zip");

export function createScriptPrisma() {
  const url = normalizeScriptDatabaseUrl(process.env.DATABASE_URL ?? process.env.DIRECT_URL);

  return new PrismaClient(
    url
      ? {
          datasources: {
            db: { url }
          }
        }
      : undefined
  );
}

function normalizeScriptDatabaseUrl(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "60");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "30");
    }
    return url.toString();
  } catch {
    return value;
  }
}

export function parseImageArgs(argv = process.argv.slice(2)): ImageScriptOptions {
  const options: ImageScriptOptions = { force: false };

  for (const arg of argv) {
    if (arg === "--force") {
      options.force = true;
    } else if (arg.startsWith("--limit=")) {
      const limit = Number(arg.replace("--limit=", ""));
      if (Number.isInteger(limit) && limit > 0) {
        options.limit = limit;
      }
    } else if (arg.startsWith("--match=")) {
      const match = arg.replace("--match=", "").trim().toLowerCase();
      if (match) {
        options.match = match;
      }
    } else if (arg.startsWith("--only=")) {
      const values = arg
        .replace("--only=", "")
        .split(",")
        .map((value) => normalizeOnly(value))
        .filter((value): value is ImageTargetType => Boolean(value));
      options.only = new Set(values);
    }
  }

  return options;
}

function normalizeOnly(value: string): ImageTargetType | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "menu") return "menu";
  if (normalized === "gift-card" || normalized === "gift-cards" || normalized === "giftcards") {
    return "gift-card";
  }
  if (normalized === "site") return "site";
  return null;
}

export function filterManifest(entries: ImageManifestEntry[], options: ImageScriptOptions) {
  let filtered = entries;

  if (options.only?.size) {
    filtered = filtered.filter((entry) => options.only?.has(entry.type));
  }

  if (options.match) {
    filtered = filtered.filter((entry) =>
      [entry.name, entry.slug, entry.category ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(options.match ?? "")
    );
  }

  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function fileExists(filePath: string) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/\$/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function publicPathToFilePath(publicPath: string) {
  return path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
}

export function relativeOutputPath(publicPath: string) {
  return path.relative(process.cwd(), publicPathToFilePath(publicPath)).replaceAll("\\", "/");
}

export function menuPublicPath(slug: string) {
  return `/images/menu/${slug}.png`;
}

export function giftCardSlug(name: string, amount: number) {
  const wholeAmount = Math.round(amount);
  return `${wholeAmount}-dollar-gift-card`;
}

export function giftCardPublicPath(name: string, amount: number) {
  return `/images/gift-cards/${giftCardSlug(name, amount)}.png`;
}

export function sitePublicPath(slug: string) {
  return `/images/site/${slug}.png`;
}

export async function loadManifest(): Promise<ImageManifest> {
  return JSON.parse(await fs.readFile(manifestPath, "utf8")) as ImageManifest;
}

export async function saveJson(filePath: string, data: unknown) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export async function buildImageManifest(options: ImageScriptOptions = { force: false }) {
  const prisma = createScriptPrisma();

  try {
    const entries: ImageManifestEntry[] = [];

    if (!options.only?.size || options.only.has("menu")) {
      const menuItems = await prisma.menuItem.findMany({
        include: { category: true },
        orderBy: [{ category: { name: "asc" } }, { name: "asc" }]
      });

      for (const item of menuItems) {
        const publicPath = menuPublicPath(item.slug);
        entries.push({
          type: "menu",
          id: item.id,
          name: item.name,
          slug: item.slug,
          category: item.category.name,
          prompt: menuPrompt(item.name, item.category.name),
          outputPath: relativeOutputPath(publicPath),
          publicPath,
          dbFieldTarget: {
            model: "MenuItem",
            id: item.id,
            field: "imageUrl"
          }
        });
      }
    }

    if (!options.only?.size || options.only.has("gift-card")) {
      const templates = await prisma.giftCardTemplate.findMany({
        orderBy: { amount: "asc" }
      });

      for (const template of templates) {
        const amount = Number(template.amount);
        const slug = giftCardSlug(template.name, amount);
        const publicPath = giftCardPublicPath(template.name, amount);
        entries.push({
          type: "gift-card",
          id: template.id,
          name: template.name,
          slug,
          category: "Gift Cards",
          prompt: giftCardPrompt(template.name, amount),
          outputPath: relativeOutputPath(publicPath),
          publicPath,
          dbFieldTarget: {
            model: "GiftCardTemplate",
            id: template.id,
            field: "imageUrl"
          }
        });
      }
    }

    if (!options.only?.size || options.only.has("site")) {
      const siteTargets = [
        {
          id: "home-hero-coffee",
          name: "Home hero coffee",
          prompt:
            "Premium futuristic coffee hero image: a luminous espresso drink on a dark stone counter, emerald accent lighting, realistic commercial cafe photography style, no logos, no watermark."
        },
        {
          id: "home-sanctuary-interior",
          name: "Luxury coffee shop interior",
          prompt:
            "Premium modern coffee shop interior with dark green botanical luxury mood, warm counter lighting, glass and wood texture, no visible logos, commercial website section image."
        },
        {
          id: "about-coffee-bar",
          name: "Coffee shop bar",
          prompt:
            "Premium coffee bar scene with espresso machine silhouette, cups, dark stone, emerald glow, realistic polished website image, no logos, no watermark."
        }
      ];

      for (const target of siteTargets) {
        const publicPath = sitePublicPath(target.id);
        entries.push({
          type: "site",
          id: target.id,
          name: target.name,
          slug: target.id,
          category: "Site",
          prompt: target.prompt,
          outputPath: relativeOutputPath(publicPath),
          publicPath
        });
      }
    }

    const filtered = filterManifest(entries, options);
    return {
      generatedAt: new Date().toISOString(),
      count: filtered.length,
      entries: filtered
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    console.warn("Database manifest read failed. Falling back to seed data.");
    console.warn(message);
    return buildSeedManifest(options);
  } finally {
    await prisma.$disconnect();
  }
}

async function buildSeedManifest(options: ImageScriptOptions) {
  const seed = await import("../prisma/seed");
  const entries: ImageManifestEntry[] = [];
  const nameCounts = new Map<string, number>();

  for (const group of seed.MENU_DATA) {
    for (const name of group.items) {
      const slug = seed.slugify(name);
      nameCounts.set(slug, (nameCounts.get(slug) ?? 0) + 1);
    }
  }

  if (!options.only?.size || options.only.has("menu")) {
    for (const group of seed.MENU_DATA) {
      for (const name of group.items) {
        const slug = seed.itemSlug(name, group.category, nameCounts);
        const publicPath = menuPublicPath(slug);
        entries.push({
          type: "menu",
          id: slug,
          name,
          slug,
          category: group.category,
          prompt: menuPrompt(name, group.category),
          outputPath: relativeOutputPath(publicPath),
          publicPath
        });
      }
    }
  }

  if (!options.only?.size || options.only.has("gift-card")) {
    for (const template of seed.GIFT_CARD_TEMPLATES) {
      const slug = giftCardSlug(template.name, template.amount);
      const publicPath = giftCardPublicPath(template.name, template.amount);
      entries.push({
        type: "gift-card",
        id: slug,
        name: template.name,
        slug,
        category: "Gift Cards",
        prompt: giftCardPrompt(template.name, template.amount),
        outputPath: relativeOutputPath(publicPath),
        publicPath
      });
    }
  }

  if (!options.only?.size || options.only.has("site")) {
    for (const entry of buildSiteEntries()) {
      entries.push(entry);
    }
  }

  const filtered = filterManifest(entries, options);
  return {
    generatedAt: new Date().toISOString(),
    count: filtered.length,
    entries: filtered
  };
}

function buildSiteEntries(): ImageManifestEntry[] {
  const siteTargets = [
    {
      id: "home-hero-coffee",
      name: "Home hero coffee",
      prompt:
        "Premium futuristic coffee hero image: a luminous espresso drink on a dark stone counter, emerald accent lighting, realistic commercial cafe photography style, no logos, no watermark."
    },
    {
      id: "home-sanctuary-interior",
      name: "Luxury coffee shop interior",
      prompt:
        "Premium modern coffee shop interior with dark green botanical luxury mood, warm counter lighting, glass and wood texture, no visible logos, commercial website section image."
    },
    {
      id: "about-coffee-bar",
      name: "Coffee shop bar",
      prompt:
        "Premium coffee bar scene with espresso machine silhouette, cups, dark stone, emerald glow, realistic polished website image, no logos, no watermark."
    }
  ];

  return siteTargets.map((target) => {
    const publicPath = sitePublicPath(target.id);
    return {
      type: "site",
      id: target.id,
      name: target.name,
      slug: target.id,
      category: "Site",
      prompt: target.prompt,
      outputPath: relativeOutputPath(publicPath),
      publicPath
    };
  });
}

export function menuPrompt(name: string, category: string) {
  const lower = `${name} ${category}`.toLowerCase();
  const type = inferVisualType(name, category);
  const flavor = flavorDescription(lower);

  if (type === "food") {
    return `A premium commercial food photography image of ${name}, ${flavor}, clean plated cafe presentation, realistic appetizing texture, warm controlled lighting, dark neutral premium surface, centered menu-friendly square composition, no logos, no watermark.`;
  }

  if (type === "bottle") {
    return `A premium commercial product photo of ${name} as a bottled beverage, ${flavor}, clean bottle silhouette, condensation, dark premium cafe backdrop, sharp centered square composition, no copyrighted branding, no logo, no watermark.`;
  }

  if (type === "coffee-bag") {
    return `A premium commercial product photo of ${name} as a whole-bean coffee bag, elegant unbranded packaging, dark green premium cafe styling, crisp centered square composition, no copyrighted branding, no logo, no watermark.`;
  }

  if (type === "instant-pack") {
    return `A premium commercial product photo of ${name} as instant coffee sachets in elegant unbranded packaging, dark green premium cafe styling, crisp centered square composition, no whole-bean label, no copyrighted branding, no logo, no watermark.`;
  }

  return `A premium commercial product photo of ${name}, ${flavor}, realistic cafe menu photography style, clean centered drink composition, dark neutral luxury backdrop with subtle emerald accent lighting, high detail, square format, no visible copyrighted branding, no logo, no watermark.`;
}

export function giftCardPrompt(name: string, amount: number) {
  return `A premium digital gift card design mockup for a coffee shop website, value ${amount} dollars, dark green futuristic luxury theme, elegant abstract aurora accents, modern card on a dark surface, original branding-free artwork, square ecommerce display, no official logos, no watermark.`;
}

export function inferVisualType(name: string, category: string) {
  const lower = `${name} ${category}`.toLowerCase();
  if (category.includes("VIA Instant") || lower.includes("via instant")) return "instant-pack";
  if (category.startsWith("At Home Coffee")) return "coffee-bag";
  if (category === "Bottled Beverages") return "bottle";
  if (
    ["Breakfast", "Bakery", "Treats", "Lunch"].includes(category) ||
    /sandwich|pocket|focaccia|cake pop|croissant|danish|muffin|scone|cake|loaf|cookie|bar|bagel|brownie|madeleines|biscotti|grahams|bites|bakes|spread|protein box/.test(
      lower
    )
  ) {
    return "food";
  }
  return "drink";
}

function flavorDescription(lower: string) {
  if (lower.includes("matcha")) return "vibrant green matcha tones and creamy texture";
  if (lower.includes("cold brew") || lower.includes("nitro")) return "rich dark coffee tones with ice and crema";
  if (lower.includes("espresso")) return "deep espresso tones with layered milk";
  if (lower.includes("mocha") || lower.includes("chocolate")) return "chocolate coffee tones and glossy cocoa accents";
  if (lower.includes("caramel")) return "warm caramel ribbons and creamy coffee texture";
  if (lower.includes("strawberry") || lower.includes("pink")) return "fresh strawberry color and bright fruit notes";
  if (lower.includes("mango") || lower.includes("dragon")) return "golden mango and magenta fruit colors";
  if (lower.includes("butterfly")) return "botanical violet-blue citrus color notes";
  if (lower.includes("lavender")) return "soft lavender color accents";
  if (lower.includes("chai")) return "spiced tea warmth and creamy foam";
  if (lower.includes("tea")) return "clear tea color and refined cafe styling";
  if (lower.includes("lemonade")) return "bright lemon color and refreshing citrus styling";
  if (lower.includes("frappuccino") || lower.includes("blended")) {
    return "blended iced texture with whipped topping where appropriate";
  }
  if (lower.includes("croissant")) return "flaky golden pastry layers";
  if (lower.includes("cake")) return "soft dessert texture and polished frosting detail";
  if (lower.includes("sandwich") || lower.includes("focaccia") || lower.includes("ciabatta")) {
    return "toasted bread texture with visible savory filling";
  }
  if (lower.includes("bagel")) return "golden bread crust and cafe bakery styling";
  return "premium cafe styling matched to the item name";
}
