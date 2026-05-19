"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MenuCard } from "@/components/menu/MenuCard";
import type { PublicCategory, PublicMenuItem } from "@/components/menu/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { inputClasses } from "@/components/ui/Form";
import { cn } from "@/lib/utils";

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
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory = category === "all" || item.category.slug === category;
      const matchesQuery =
        !normalized ||
        item.name.toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized);

      return matchesCategory && matchesQuery;
    });
  }, [category, items, query]);

  return (
    <div className="space-y-10">
      <div className="glass-card sticky top-24 z-20 rounded-xl p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:w-96">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              size={18}
            />
            <input
              className={cn(inputClasses, "pl-11")}
              placeholder="Search coffee, matcha, dessert..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={cn(
                "focus-ring shrink-0 rounded-full border px-4 py-2 font-mono text-[11px] font-bold uppercase transition",
                category === "all"
                  ? "border-primary bg-primary text-on-primary"
                  : "border-white/10 bg-white/[0.03] text-on-surface-variant hover:text-primary"
              )}
            >
              All
            </button>
            {categories.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setCategory(item.slug)}
                className={cn(
                  "focus-ring shrink-0 rounded-full border px-4 py-2 font-mono text-[11px] font-bold uppercase transition",
                  category === item.slug
                    ? "border-primary bg-primary text-on-primary"
                    : "border-white/10 bg-white/[0.03] text-on-surface-variant hover:text-primary"
                )}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <MenuCard key={item.id} item={item} role={role} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No drinks found"
          description="Try a different category or search term. The bar changes quickly."
        />
      )}
    </div>
  );
}
