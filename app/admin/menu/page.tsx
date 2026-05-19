import {
  CreateCategoryForm,
  CreateMenuItemForm,
  EditCategoryForm,
  EditMenuItemForm
} from "@/components/admin/AdminMenuForms";
import { GlassCard } from "@/components/ui/GlassCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const categories = await prisma.menuCategory.findMany({
    include: { items: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" }
  });
  const simpleCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description
  }));
  const items = categories.flatMap((category) =>
    category.items.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      price: Number(item.price),
      imageUrl: item.imageUrl,
      categoryId: item.categoryId,
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured
    }))
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase text-primary">
          Menu management
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold uppercase">Live menu</h1>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-8">
          <GlassCard className="p-5">
            <h2 className="mb-5 font-display text-2xl font-semibold">Add menu item</h2>
            <CreateMenuItemForm categories={simpleCategories} />
          </GlassCard>
          <GlassCard className="p-5">
            <h2 className="mb-5 font-display text-2xl font-semibold">Add category</h2>
            <CreateCategoryForm />
          </GlassCard>
          <GlassCard className="p-5">
            <h2 className="mb-5 font-display text-2xl font-semibold">Categories</h2>
            <div className="space-y-4">
              {simpleCategories.map((category) => (
                <EditCategoryForm key={category.id} category={category} />
              ))}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-5">
          <h2 className="mb-5 font-display text-2xl font-semibold">Menu items</h2>
          <div className="space-y-4">
            {items.length ? (
              items.map((item) => (
                <EditMenuItemForm key={item.id} item={item} categories={simpleCategories} />
              ))
            ) : (
              <p className="text-on-surface-variant">No menu items yet.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
