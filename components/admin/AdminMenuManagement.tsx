"use client";

import { FolderTree, ListFilter, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CreateCategoryForm,
  CreateMenuItemForm,
  EditCategoryForm,
  EditMenuItemForm
} from "@/components/admin/AdminMenuForms";
import { GlassCard } from "@/components/ui/GlassCard";
import { inputClasses, labelClasses } from "@/components/ui/Form";
import { cn, formatCurrency } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

type MenuItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  isAvailable: boolean;
  isFeatured: boolean;
};

type Tab = "categories" | "items";
type AvailabilityFilter = "all" | "available" | "unavailable";

export function AdminMenuManagement({
  categories,
  items
}: {
  categories: Category[];
  items: MenuItem[];
}) {
  const [tab, setTab] = useState<Tab>("categories");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id ?? "");

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch);
      const matchesCategory = categoryFilter === "all" || item.categoryId === categoryFilter;
      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && item.isAvailable) ||
        (availabilityFilter === "unavailable" && !item.isAvailable);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [availabilityFilter, categoryFilter, items, search]);
  const selectedItem =
    filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0] ?? null;

  useEffect(() => {
    if (filteredItems.length && !filteredItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
        {[
          { id: "categories" as const, label: "Categories", icon: FolderTree },
          { id: "items" as const, label: "Items", icon: ListFilter }
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "focus-ring inline-flex items-center gap-2 rounded-full px-4 py-3 font-mono text-[11px] font-bold uppercase transition",
              tab === item.id
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-primary"
            )}
          >
            <item.icon size={15} />
            {item.label}
          </button>
        ))}
      </div>

      {tab === "categories" ? (
        <section className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
          <GlassCard className="h-fit p-5">
            <p className="font-mono text-[10px] font-bold uppercase text-primary">
              Category setup
            </p>
            <h2 className="mb-5 mt-2 font-display text-2xl font-semibold">
              Create category
            </h2>
            <CreateCategoryForm />
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase text-primary">
                  {categories.length} categories
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold">
                  Manage categories
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-on-surface-variant">
                Category edits stay separate from product settings. Items keep their category by
                dropdown assignment.
              </p>
            </div>
            <div className="space-y-4">
              {categories.length ? (
                categories.map((category) => (
                  <EditCategoryForm key={category.id} category={category} />
                ))
              ) : (
                <p className="text-on-surface-variant">No categories yet.</p>
              )}
            </div>
          </GlassCard>
        </section>
      ) : (
        <section className="space-y-8">
          <GlassCard className="p-5">
            <p className="font-mono text-[10px] font-bold uppercase text-primary">
              Product setup
            </p>
            <h2 className="mb-5 mt-2 font-display text-2xl font-semibold">Add menu item</h2>
            <CreateMenuItemForm categories={categories} />
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase text-primary">
                  {filteredItems.length} of {items.length} items
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold">Manage items</h2>
              </div>
              <div className="grid min-w-0 gap-3 md:grid-cols-3 xl:w-[48rem]">
                <div>
                  <label className={labelClasses} htmlFor="admin-menu-search">
                    Search item
                  </label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                      size={16}
                    />
                    <input
                      id="admin-menu-search"
                      className={cn(inputClasses, "pl-10")}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Latte, cake..."
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClasses} htmlFor="admin-category-filter">
                    Category
                  </label>
                  <select
                    id="admin-category-filter"
                    className={inputClasses}
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                  >
                    <option value="all">All categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses} htmlFor="admin-availability-filter">
                    Availability
                  </label>
                  <select
                    id="admin-availability-filter"
                    className={inputClasses}
                    value={availabilityFilter}
                    onChange={(event) =>
                      setAvailabilityFilter(event.target.value as AvailabilityFilter)
                    }
                  >
                    <option value="all">All items</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
              {filteredItems.length ? (
                <>
                  <div className="max-h-[42rem] space-y-2 overflow-y-auto pr-1">
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItemId(item.id)}
                        className={cn(
                          "focus-ring w-full rounded-xl border p-4 text-left text-sm transition",
                          selectedItem?.id === item.id
                            ? "border-primary/45 bg-primary/10"
                            : "border-white/10 bg-white/[0.03] hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-on-surface">{item.name}</p>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {categories.find((category) => category.id === item.categoryId)?.name ??
                                "Uncategorized"}
                            </p>
                          </div>
                          <p className="shrink-0 text-primary">{formatCurrency(item.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div>
                    {selectedItem && (
                      <EditMenuItemForm
                        key={selectedItem.id}
                        item={selectedItem}
                        categories={categories}
                      />
                    )}
                  </div>
                </>
              ) : (
                <p className="text-on-surface-variant">
                  No menu items match the current filters.
                </p>
              )}
            </div>
          </GlassCard>
        </section>
      )}
    </div>
  );
}
