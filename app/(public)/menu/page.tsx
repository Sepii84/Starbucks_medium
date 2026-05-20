import type { Metadata } from "next";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import type { PublicMenuItem } from "@/components/menu/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { getCurrentUser } from "@/lib/auth";
import { getPublicMenu } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Menu | Starbucks Medium",
  description:
    "Browse the live Starbucks Medium demo menu with database-driven categories, product cards, and ordering for signed-in users."
};

export default async function MenuPage() {
  const user = await getCurrentUser().catch(() => null);
  const menuResult = await getPublicMenu()
    .then((categories) => ({ categories, error: null as string | null }))
    .catch((error) => ({
      categories: [],
      error: error instanceof Error ? error.message : "Unknown database error"
    }));
  const categories = menuResult.categories;
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
      isFeatured: item.isFeatured,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description
      }
    }))
  );
  const showDevelopmentHint = process.env.NODE_ENV === "development";
  const emptyDatabaseMessage = !process.env.DATABASE_URL
    ? "DATABASE_URL is missing. Create `.env` in the project root and add a valid PostgreSQL connection string."
    : "No menu items found. If you are developing locally, run:";

  return (
    <PublicPageFrame>
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
              Browse the full menu, filter by category, and add available items to your bag
              once you are signed in.
            </p>
          </div>
          {menuResult.error ? (
            <GlassCard className="p-6">
              <h2 className="font-display text-2xl font-semibold">Menu database is not ready</h2>
              <p className="mt-3 text-on-surface-variant">
                {showDevelopmentHint
                  ? "Check your PostgreSQL connection, run migrations, and seed the menu."
                  : "The menu is temporarily unavailable. Please check back soon."}
              </p>
              {showDevelopmentHint && (
                <pre className="mt-5 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-4 text-sm text-primary">
                  {`npm run prisma:migrate
npm run prisma:seed
npm run db:check`}
                </pre>
              )}
            </GlassCard>
          ) : items.length === 0 ? (
            <GlassCard className="p-6">
              <h2 className="font-display text-2xl font-semibold">No menu items found</h2>
              <p className="mt-3 text-on-surface-variant">
                {showDevelopmentHint
                  ? emptyDatabaseMessage
                  : "The menu is temporarily unavailable. Please check back soon."}
              </p>
              {showDevelopmentHint && process.env.DATABASE_URL && (
                <pre className="mt-5 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-4 text-sm text-primary">
                  {`npm run prisma:migrate
npm run prisma:seed
npm run db:check`}
                </pre>
              )}
            </GlassCard>
          ) : (
            <MenuBrowser categories={categoryList} items={items} role={user?.role ?? null} />
          )}
        </div>
      </section>
    </PublicPageFrame>
  );
}
