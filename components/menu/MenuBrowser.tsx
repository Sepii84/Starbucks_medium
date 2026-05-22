"use client";

import { ArrowLeft, Coffee, PackageOpen, Search, Utensils } from "lucide-react";
import { useMemo, useState } from "react";
import { MenuCard } from "@/components/menu/MenuCard";
import type { PublicCategory, PublicMenuItem } from "@/components/menu/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { inputClasses } from "@/components/ui/Form";
import { cn } from "@/lib/utils";

type MenuView = "categories" | "all" | string;

const drinkCategoryPatterns = [
  "coffee",
  "tea",
  "matcha",
  "refresher",
  "frappuccino",
  "lemonade",
  "beverage",
  "drink",
  "espresso",
  "latte",
  "cold brew",
  "chocolate"
];

const foodCategoryPatterns = [
  "breakfast",
  "bakery",
  "treat",
  "lunch",
  "sandwich",
  "cake",
  "food",
  "snack"
];

const foodItemPattern =
  /sandwich|pocket|focaccia|cake pop|croissant|danish|muffin|scone|loaf|cookie|bar|bagel|brownie|madeleines|biscotti|grahams|egg bites|bakes|spread|protein box|grilled cheese/i;

const drinkItemPattern =
  /coffee|tea|matcha|refresher|frappuccino|lemonade|drink|espresso|latte|cold brew|mocha|cappuccino|cortado|americano|macchiato|flat white|chai|water|milk|juice|supershot|beverage/i;

export function MenuBrowser({
  categories,
  items,
  role
}: {
  categories: PublicCategory[];
  items: PublicMenuItem[];
  role?: "USER" | "ADMIN" | null;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<MenuView>("categories");

  const normalizedQuery = query.trim().toLowerCase();
  const hasSearch = normalizedQuery.length > 0;

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.category.id, (counts.get(item.category.id) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.slug === view) ?? null,
    [categories, view]
  );

  const searchResults = useMemo(() => {
    if (!hasSearch) {
      return [];
    }

    return sortItemsForAllView(
      items.filter((item) => {
        const searchable = [
          item.name,
          item.description,
          item.category.name,
          item.category.description ?? ""
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(normalizedQuery);
      })
    );
  }, [hasSearch, items, normalizedQuery]);

  const visibleItems = useMemo(() => {
    if (hasSearch) {
      return searchResults;
    }

    if (view === "all") {
      return sortItemsForAllView(items);
    }

    if (selectedCategory) {
      return items.filter((item) => item.category.id === selectedCategory.id);
    }

    return [];
  }, [hasSearch, items, searchResults, selectedCategory, view]);

  const visibleSections = useMemo(() => {
    if (!hasSearch && selectedCategory) {
      return [
        {
          id: selectedCategory.id,
          title: selectedCategory.name,
          items: visibleItems
        }
      ];
    }

    const sections = [
      { id: "drinks", title: "Drinks", rank: 0, items: [] as PublicMenuItem[] },
      { id: "food", title: "Food & snacks", rank: 1, items: [] as PublicMenuItem[] },
      { id: "retail", title: "At-home coffee", rank: 2, items: [] as PublicMenuItem[] },
      { id: "other", title: "Other favorites", rank: 3, items: [] as PublicMenuItem[] }
    ];

    for (const item of visibleItems) {
      const rank = itemRank(item);
      sections.find((section) => section.rank === rank)?.items.push(item);
    }

    return sections.filter((section) => section.items.length > 0);
  }, [hasSearch, selectedCategory, visibleItems]);

  const categoryCards = useMemo(() => {
    const sortedCategories = [...categories].sort(
      (a, b) => categoryRank(a.name) - categoryRank(b.name) || a.name.localeCompare(b.name)
    );

    return [
      {
        id: "all",
        name: "All",
        slug: "all",
        description: "Every available menu item, ordered with drinks first.",
        count: items.length,
        tone: "all" as const
      },
      ...sortedCategories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        count: categoryCounts.get(category.id) ?? 0,
        tone: categoryTone(category.name)
      }))
    ];
  }, [categories, categoryCounts, items.length]);

  function handleSearchChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setView("categories");
    }
  }

  function showCategory(slug: string) {
    setQuery("");
    setView(slug);
  }

  const isBrowsingItems = hasSearch || view !== "categories";
  const heading = hasSearch
    ? `Search results for "${query.trim()}"`
    : view === "all"
      ? "All menu items"
      : selectedCategory?.name ?? "Choose a category";
  const description = hasSearch
    ? "Searching across item names, descriptions, and categories."
    : view === "all"
      ? "Drinks are shown first, followed by food, snacks, and at-home coffee."
      : selectedCategory?.description;

  return (
    <div className="space-y-10">
      <div className="glass-card sticky top-24 z-20 rounded-xl p-4">
        <label htmlFor="menu-search" className="sr-only">
          Search the full menu
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
            size={18}
          />
          <input
            id="menu-search"
            className={cn(inputClasses, "pl-11")}
            placeholder="Search coffee, matcha, dessert..."
            value={query}
            onChange={(event) => handleSearchChange(event.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {!isBrowsingItems ? (
        <section aria-labelledby="menu-category-heading" className="space-y-6">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase text-primary">
              Start with a category
            </p>
            <h2
              id="menu-category-heading"
              className="mt-2 font-display text-2xl font-semibold uppercase md:text-3xl"
            >
              What are you in the mood for?
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categoryCards.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => showCategory(category.slug)}
                className="focus-ring group min-h-36 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left shadow-[inset_1px_1px_0_rgba(212,255,234,0.05)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10"
                aria-label={`Show ${category.name} menu items`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-primary transition group-hover:border-primary/40">
                    {category.tone === "food" ? (
                      <Utensils size={22} />
                    ) : category.tone === "retail" ? (
                      <PackageOpen size={22} />
                    ) : (
                      <Coffee size={22} />
                    )}
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                    {category.count} items
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold uppercase text-on-surface">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-on-surface-variant">
                    {category.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-8" aria-live="polite">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase text-primary">
                {visibleItems.length} items
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold uppercase md:text-3xl">
                {heading}
              </h2>
              {description && (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setView("categories");
              }}
              className="focus-ring inline-flex w-fit items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 font-mono text-[11px] font-bold uppercase text-on-surface transition hover:border-primary/40 hover:text-primary"
            >
              <ArrowLeft size={16} />
              Back to categories
            </button>
          </div>

          {visibleItems.length ? (
            <div className="space-y-14">
              {visibleSections.map((section) => (
                <section key={section.id} className="scroll-mt-40">
                  <div className="mb-6">
                    <p className="font-mono text-[11px] font-bold uppercase text-primary">
                      {section.items.length} items
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold uppercase md:text-3xl">
                      {section.title}
                    </h3>
                  </div>
                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((item) => (
                      <MenuCard key={item.id} item={item} role={role} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No menu items found"
              description="Try a different search term or return to the category view."
            />
          )}
        </section>
      )}
    </div>
  );
}

function sortItemsForAllView(items: PublicMenuItem[]) {
  return [...items].sort(
    (a, b) =>
      itemRank(a) - itemRank(b) ||
      a.category.name.localeCompare(b.category.name) ||
      a.name.localeCompare(b.name)
  );
}

function itemRank(item: PublicMenuItem) {
  const normalized = `${item.name} ${item.category.name}`.toLowerCase();

  if (
    normalized.includes("whole bean") ||
    normalized.includes("via instant") ||
    normalized.includes("at home")
  ) {
    return 2;
  }

  if (foodItemPattern.test(normalized) || categoryRank(item.category.name) === 1) {
    return 1;
  }

  if (drinkItemPattern.test(normalized) || categoryRank(item.category.name) === 0) {
    return 0;
  }

  return 3;
}

function categoryRank(categoryName: string) {
  const normalized = categoryName.toLowerCase();

  if (drinkCategoryPatterns.some((pattern) => normalized.includes(pattern))) {
    return 0;
  }

  if (foodCategoryPatterns.some((pattern) => normalized.includes(pattern))) {
    return 1;
  }

  if (
    normalized.includes("whole bean") ||
    normalized.includes("via instant") ||
    normalized.includes("at home")
  ) {
    return 2;
  }

  return 3;
}

function categoryTone(categoryName: string): "drink" | "food" | "retail" | "all" {
  const rank = categoryRank(categoryName);

  if (rank === 1) {
    return "food";
  }

  if (rank === 2) {
    return "retail";
  }

  return "drink";
}
