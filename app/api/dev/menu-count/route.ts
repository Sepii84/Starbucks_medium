import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const categories = await prisma.menuCategory.count();
    const menuItems = await prisma.menuItem.count();
    const availableMenuItems = await prisma.menuItem.count({
      where: { isAvailable: true }
    });
    const featuredMenuItems = await prisma.menuItem.count({
      where: { isFeatured: true }
    });

    return NextResponse.json({
      categories,
      menuItems,
      availableMenuItems,
      featuredMenuItems
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Database count failed. Check DATABASE_URL, run migrations, and seed the database.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
