import { AdminMenuManagement } from "@/components/admin/AdminMenuManagement";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const [categories, menuItems] = await Promise.all([
    prisma.menuCategory.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.menuItem.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        imageUrl: true,
        categoryId: true,
        isAvailable: true,
        isFeatured: true
      },
      orderBy: [{ name: "asc" }]
    })
  ]);
  const simpleCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description
  }));
  const items = menuItems.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    price: Number(item.price),
    imageUrl: item.imageUrl,
    categoryId: item.categoryId,
    isAvailable: item.isAvailable,
    isFeatured: item.isFeatured
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase text-primary">
          Menu management
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold uppercase">Live menu</h1>
      </div>

      <AdminMenuManagement categories={simpleCategories} items={items} />
    </div>
  );
}
