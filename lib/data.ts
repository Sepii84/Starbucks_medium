import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const fallbackSiteInfo = {
  id: "fallback",
  aboutText:
    "Starbucks Medium blends slow craft with luminous, future-facing hospitality.",
  footerDescription:
    "A dark luxury coffee sanctuary serving botanical drinks, classic espresso, and precise online ordering.",
  address: "118 Emerald Ave, Seattle, WA",
  phone: "+1 (206) 555-0147",
  email: "hello@starbucksmedium.local",
  openingHours: "Mon-Sun 7:00 AM - 10:00 PM",
  instagramUrl: "https://instagram.com",
  twitterUrl: "https://twitter.com",
  mapUrl: "",
  updatedAt: new Date()
};

export async function getSiteInfo() {
  if (!process.env.DATABASE_URL) {
    return fallbackSiteInfo;
  }

  const siteInfo = await prisma.siteInfo.findFirst({
    orderBy: { updatedAt: "desc" }
  });

  return siteInfo ?? fallbackSiteInfo;
}

export async function getPublicMenu() {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  return prisma.menuCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { name: "asc" },
        include: { category: true }
      }
    }
  });
}

export async function getFeaturedMenuItems(limit = 3) {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  return prisma.menuItem.findMany({
    where: { isAvailable: true },
    include: { category: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
    take: limit
  });
}

export async function getAdminNotificationCount() {
  return prisma.notification.count({ where: { isRead: false } });
}

export async function getDashboardStats() {
  const [totalOrders, pendingOrders, completedOrders, totalUsers, revenue, recentOrders, notifications] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.user.count({ where: { role: Role.USER } }),
      prisma.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { totalPrice: true }
      }),
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { user: true, items: { include: { menuItem: true } } }
      }),
      prisma.notification.findMany({
        take: 6,
        orderBy: { createdAt: "desc" }
      })
    ]);

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    totalUsers,
    totalRevenue: Number(revenue._sum.totalPrice ?? 0),
    recentOrders,
    notifications
  };
}
