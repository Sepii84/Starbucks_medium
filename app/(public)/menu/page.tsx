import type { Metadata } from "next";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { JsonLd } from "@/components/seo/JsonLd";
import { GlassCard } from "@/components/ui/GlassCard";
import { getSessionUser } from "@/lib/auth";
import { getPublicMenuCategories } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "Menu | Starbucks Medium",
    description:
      "Browse coffee, espresso drinks, refreshers, teas, frappuccinos, bakery items, breakfast favorites, and more.",
    path: "/menu"
  })
};

export default async function MenuPage() {
  const user = await getSessionUser().catch(() => null);
  const menuResult = await getPublicMenuCategories()
    .then((categories) => ({ categories, error: null as string | null }))
    .catch((error) => ({
      categories: [],
      error: error instanceof Error ? error.message : "Unknown database error"
    }));
  const categories = menuResult.categories;
  const totalItems = categories.reduce((sum, category) => sum + category.itemCount, 0);
  const showDevelopmentHint = process.env.NODE_ENV === "development";
  const emptyDatabaseMessage = !process.env.DATABASE_URL
    ? "DATABASE_URL is missing. Create `.env` in the project root and add a valid PostgreSQL connection string."
    : "No menu items found. If you are developing locally, run:";

  return (
    <PublicPageFrame>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Menu", path: "/menu" }
        ])}
      />
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
              Search the full menu, choose a category, and add available items to your bag
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
          ) : totalItems === 0 ? (
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
            <MenuBrowser categories={categories} role={user?.role ?? null} />
          )}
        </div>
      </section>
    </PublicPageFrame>
  );
}
