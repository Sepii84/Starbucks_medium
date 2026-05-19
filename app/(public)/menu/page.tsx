import { MenuBrowser } from "@/components/menu/MenuBrowser";
import type { PublicMenuItem } from "@/components/menu/types";
import { getCurrentUser } from "@/lib/auth";
import { getPublicMenu } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const [user, categories] = await Promise.all([getCurrentUser(), getPublicMenu()]);
  const categoryList = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description
  }));
  const items: PublicMenuItem[] = categories.flatMap((category) =>
    category.items.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description
      }
    }))
  );

  return (
    <section className="px-5 py-14 md:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="font-mono text-[11px] font-bold uppercase text-primary">
            Live database menu
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase md:text-6xl">
            Order the glow
          </h1>
          <p className="mt-5 text-lg leading-8 text-on-surface-variant">
            Browse the full bar, filter by category, and add available drinks to your bag
            once you are signed in.
          </p>
        </div>
        <MenuBrowser categories={categoryList} items={items} role={user?.role ?? null} />
      </div>
    </section>
  );
}
