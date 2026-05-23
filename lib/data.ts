import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SOCIAL_LINKS, normalizeSocialLink } from "@/lib/site-config";

export const PUBLIC_MENU_TAG = "public-menu";
export const SITE_INFO_TAG = "site-info";
export const GIFT_CARDS_TAG = "gift-cards";
export const REWARDS_TAG = "rewards";

const fallbackSiteInfo = {
  id: "fallback",
  aboutText:
    "Starbucks Medium blends slow craft with luminous, future-facing hospitality.",
  footerDescription:
    "A dark luxury coffee sanctuary serving botanical drinks, classic espresso, and precise online ordering.",
  address: "118 Emerald Ave, Seattle, WA",
  phone: "+1 (206) 555-0147",
  email: "hello@starbucksmedium.com",
  openingHours: "Mon-Sun 7:00 AM - 10:00 PM",
  instagramUrl: DEFAULT_SOCIAL_LINKS.instagramUrl,
  twitterUrl: DEFAULT_SOCIAL_LINKS.twitterUrl,
  mapUrl: "",
  updatedAt: new Date()
};

export async function getSiteInfo() {
  if (!process.env.DATABASE_URL) {
    return fallbackSiteInfo;
  }

  return getCachedSiteInfo();
}

const getCachedSiteInfo = unstable_cache(
  async () => {
    try {
      const siteInfo = await prisma.siteInfo.findFirst({
        orderBy: { updatedAt: "desc" }
      });

      return normalizePublicSiteInfo(siteInfo ?? fallbackSiteInfo);
    } catch {
      return fallbackSiteInfo;
    }
  },
  ["site-info"],
  { revalidate: 300, tags: [SITE_INFO_TAG] }
);

export async function getPublicMenuCategories() {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  return getCachedPublicMenuCategories();
}

const getCachedPublicMenuCategories = unstable_cache(
  async () => {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        items: {
          where: { isAvailable: true },
          select: { id: true }
        }
      }
    });

    return categories.map(({ items, ...category }) => ({
      ...category,
      itemCount: items.length
    }));
  },
  ["public-menu-categories"],
  { revalidate: 300, tags: [PUBLIC_MENU_TAG] }
);

export async function getPublicMenuItemsFlat() {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  return getCachedPublicMenuItemsFlat();
}

const getCachedPublicMenuItemsFlat = unstable_cache(
  async () => {
    const items = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        isAvailable: true,
        isFeatured: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        }
      }
    });

    return items.map((item) => ({
      ...item,
      price: Number(item.price)
    }));
  },
  ["public-menu-items-flat"],
  { revalidate: 300, tags: [PUBLIC_MENU_TAG] }
);

export async function getActiveGiftCardTemplates() {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  return getCachedActiveGiftCardTemplates();
}

const getCachedActiveGiftCardTemplates = unstable_cache(
  async () => {
    const templates = await prisma.giftCardTemplate.findMany({
      where: { isActive: true },
      orderBy: { amount: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
        imageUrl: true
      }
    });

    return templates.map((template) => ({
      ...template,
      amount: Number(template.amount)
    }));
  },
  ["active-gift-card-templates"],
  { revalidate: 300, tags: [GIFT_CARDS_TAG] }
);

export async function getActiveRewardRules() {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  return getCachedActiveRewardRules();
}

const getCachedActiveRewardRules = unstable_cache(
  async () => {
    const rewardRules = await prisma.rewardRule.findMany({
      where: {
        isActive: true,
        menuItem: { isAvailable: true }
      },
      select: {
        id: true,
        pointsRequired: true,
        menuItem: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true
              }
            }
          }
        }
      },
      orderBy: [{ pointsRequired: "asc" }, { createdAt: "asc" }]
    });

    return rewardRules.map((rule) => ({
      ...rule,
      menuItem: {
        ...rule.menuItem,
        price: Number(rule.menuItem.price)
      }
    }));
  },
  ["active-reward-rules"],
  { revalidate: 300, tags: [REWARDS_TAG, PUBLIC_MENU_TAG] }
);

export async function getPublicMenu() {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  return getCachedPublicMenu();
}

const getCachedPublicMenu = unstable_cache(
  async () =>
    prisma.menuCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { name: "asc" }
        }
      }
    }),
  ["public-menu-full"],
  { revalidate: 300, tags: [PUBLIC_MENU_TAG] }
);

export async function getFeaturedMenuItems(limit = 3) {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  return (await getCachedFeaturedMenuItems()).slice(0, limit);
}

const getCachedFeaturedMenuItems = unstable_cache(
  async () => {
    const items = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
      take: 6
    });

    return items.map((item) => ({
      ...item,
      price: Number(item.price)
    }));
  },
  ["featured-menu-items"],
  { revalidate: 300, tags: [PUBLIC_MENU_TAG] }
);

export async function getAdminNotificationCount() {
  return prisma.notification.count({ where: { isRead: false } });
}

export async function getDashboardStats() {
  const [summary, recentOrders, notifications] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        totalOrders: bigint;
        pendingOrders: bigint;
        completedOrders: bigint;
        totalUsers: bigint;
        totalRevenue: unknown;
      }>
    >`
      SELECT
        (SELECT COUNT(*) FROM "Order") AS "totalOrders",
        (SELECT COUNT(*) FROM "Order" WHERE "status" = 'PENDING') AS "pendingOrders",
        (SELECT COUNT(*) FROM "Order" WHERE "status" = 'COMPLETED') AS "completedOrders",
        (SELECT COUNT(*) FROM "User" WHERE "role" = 'USER') AS "totalUsers",
        (SELECT COALESCE(SUM("totalPrice"), 0) FROM "Order" WHERE "status" <> 'CANCELLED') AS "totalRevenue"
    `,
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customerName: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        user: { select: { email: true } }
      }
    }),
    prisma.notification.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        message: true,
        isRead: true,
        createdAt: true
      }
    })
  ]);
  const stats = summary[0];

  return {
    totalOrders: Number(stats?.totalOrders ?? 0),
    pendingOrders: Number(stats?.pendingOrders ?? 0),
    completedOrders: Number(stats?.completedOrders ?? 0),
    totalUsers: Number(stats?.totalUsers ?? 0),
    totalRevenue: Number(stats?.totalRevenue ?? 0),
    recentOrders,
    notifications
  };
}

function normalizePublicSiteInfo<
  T extends { email: string; instagramUrl?: string | null; twitterUrl?: string | null }
>(siteInfo: T): T {
  return {
    ...siteInfo,
    email: siteInfo.email.endsWith(".local") ? "hello@starbucksmedium.com" : siteInfo.email,
    instagramUrl: normalizeSocialLink(siteInfo.instagramUrl, "instagramUrl"),
    twitterUrl: normalizeSocialLink(siteInfo.twitterUrl, "twitterUrl")
  };
}
