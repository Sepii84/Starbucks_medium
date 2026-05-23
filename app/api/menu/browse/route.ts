import { NextRequest, NextResponse } from "next/server";
import { getPublicMenuItemsFlat } from "@/lib/data";

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";
  const allItems = await getPublicMenuItemsFlat();

  const items = allItems.filter((item) => {
    if (query) {
      return [
        item.name,
        item.description,
        item.category.name,
        item.category.description ?? ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    }

    if (category && category !== "all") {
      return item.category.slug === category;
    }

    return Boolean(category === "all");
  });

  return NextResponse.json({ items });
}
