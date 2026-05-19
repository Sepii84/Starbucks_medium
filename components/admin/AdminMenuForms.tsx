"use client";

import { useActionState } from "react";
import {
  createCategoryAction,
  createMenuItemAction,
  deleteCategoryAction,
  deleteMenuItemAction,
  updateCategoryAction,
  updateMenuItemAction
} from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import { emptyActionState, formatCurrency } from "@/lib/utils";

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

function CategorySelect({
  categories,
  defaultValue
}: {
  categories: Category[];
  defaultValue?: string;
}) {
  return (
    <select className={inputClasses} name="categoryId" defaultValue={defaultValue}>
      <option value="">Choose category</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}

export function CreateMenuItemForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(createMenuItemAction, emptyActionState);

  return (
    <form action={action} className="space-y-4">
      <FormMessage message={state.message} ok={state.ok} />
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClasses}>Name</label>
          <input className={inputClasses} name="name" />
          <FieldError messages={state.errors?.name} />
        </div>
        <div>
          <label className={labelClasses}>Slug</label>
          <input className={inputClasses} name="slug" placeholder="Auto-generated if blank" />
        </div>
        <div>
          <label className={labelClasses}>Price</label>
          <input className={inputClasses} name="price" step="0.01" type="number" />
          <FieldError messages={state.errors?.price} />
        </div>
        <div>
          <label className={labelClasses}>Category</label>
          <CategorySelect categories={categories} />
          <FieldError messages={state.errors?.categoryId} />
        </div>
      </div>
      <div>
        <label className={labelClasses}>Image URL</label>
        <input className={inputClasses} name="imageUrl" />
        <FieldError messages={state.errors?.imageUrl} />
      </div>
      <div>
        <label className={labelClasses}>Description</label>
        <textarea className={inputClasses} name="description" rows={3} />
        <FieldError messages={state.errors?.description} />
      </div>
      <label className="flex items-center gap-3 text-sm text-on-surface-variant">
        <input name="isAvailable" type="checkbox" defaultChecked />
        Available on public menu
      </label>
      <label className="flex items-center gap-3 text-sm text-on-surface-variant">
        <input name="isFeatured" type="checkbox" />
        Featured item
      </label>
      <Button disabled={pending} type="submit">
        {pending ? "Creating..." : "Add Menu Item"}
      </Button>
    </form>
  );
}

export function EditMenuItemForm({
  item,
  categories
}: {
  item: MenuItem;
  categories: Category[];
}) {
  const [state, action, pending] = useActionState(updateMenuItemAction, emptyActionState);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <input type="hidden" name="id" value={item.id} />
      <FormMessage message={state.message} ok={state.ok} />
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">{item.name}</h3>
          <p className="text-sm text-primary">{formatCurrency(item.price)}</p>
        </div>
        <Button formAction={deleteMenuItemAction} type="submit" variant="danger">
          Delete
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClasses}>Name</label>
          <input className={inputClasses} name="name" defaultValue={item.name} />
          <FieldError messages={state.errors?.name} />
        </div>
        <div>
          <label className={labelClasses}>Slug</label>
          <input className={inputClasses} name="slug" defaultValue={item.slug} />
        </div>
        <div>
          <label className={labelClasses}>Price</label>
          <input
            className={inputClasses}
            name="price"
            step="0.01"
            type="number"
            defaultValue={item.price}
          />
          <FieldError messages={state.errors?.price} />
        </div>
        <div>
          <label className={labelClasses}>Category</label>
          <CategorySelect categories={categories} defaultValue={item.categoryId} />
        </div>
      </div>
      <div>
        <label className={labelClasses}>Image URL</label>
        <input className={inputClasses} name="imageUrl" defaultValue={item.imageUrl} />
        <FieldError messages={state.errors?.imageUrl} />
      </div>
      <div>
        <label className={labelClasses}>Description</label>
        <textarea
          className={inputClasses}
          name="description"
          rows={3}
          defaultValue={item.description}
        />
      </div>
      <label className="flex items-center gap-3 text-sm text-on-surface-variant">
        <input name="isAvailable" type="checkbox" defaultChecked={item.isAvailable} />
        Available on public menu
      </label>
      <label className="flex items-center gap-3 text-sm text-on-surface-variant">
        <input name="isFeatured" type="checkbox" defaultChecked={item.isFeatured} />
        Featured item
      </label>
      <Button disabled={pending} type="submit" variant="secondary">
        {pending ? "Saving..." : "Save Item"}
      </Button>
    </form>
  );
}

export function CreateCategoryForm() {
  const [state, action, pending] = useActionState(createCategoryAction, emptyActionState);

  return (
    <form action={action} className="space-y-4">
      <FormMessage message={state.message} ok={state.ok} />
      <div>
        <label className={labelClasses}>Name</label>
        <input className={inputClasses} name="name" />
        <FieldError messages={state.errors?.name} />
      </div>
      <div>
        <label className={labelClasses}>Slug</label>
        <input className={inputClasses} name="slug" placeholder="Auto-generated if blank" />
      </div>
      <div>
        <label className={labelClasses}>Description</label>
        <textarea className={inputClasses} name="description" rows={3} />
      </div>
      <Button disabled={pending} type="submit">
        {pending ? "Creating..." : "Add Category"}
      </Button>
    </form>
  );
}

export function EditCategoryForm({ category }: { category: Category }) {
  const [state, action, pending] = useActionState(updateCategoryAction, emptyActionState);

  return (
    <form action={action} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <input type="hidden" name="id" value={category.id} />
      <FormMessage message={state.message} ok={state.ok} />
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className={labelClasses}>Name</label>
          <input className={inputClasses} name="name" defaultValue={category.name} />
        </div>
        <div>
          <label className={labelClasses}>Slug</label>
          <input className={inputClasses} name="slug" defaultValue={category.slug} />
        </div>
      </div>
      <div>
        <label className={labelClasses}>Description</label>
        <textarea
          className={inputClasses}
          name="description"
          rows={2}
          defaultValue={category.description ?? ""}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} type="submit" variant="secondary">
          {pending ? "Saving..." : "Save Category"}
        </Button>
        <Button formAction={deleteCategoryAction} type="submit" variant="danger">
          Delete
        </Button>
      </div>
    </form>
  );
}
