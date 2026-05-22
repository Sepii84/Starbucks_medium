"use client";

import { useActionState } from "react";
import {
  cancelGiftCardAction,
  createGiftCardTemplateAction,
  updateGiftCardTemplateAction
} from "@/app/actions/gift-cards";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import { emptyActionState, formatCurrency } from "@/lib/utils";

type Template = {
  id: string;
  name: string;
  description: string;
  amount: number;
  imageUrl?: string | null;
  isActive: boolean;
};

export function CreateGiftCardTemplateForm() {
  const [state, action, pending] = useActionState(createGiftCardTemplateAction, emptyActionState);

  return (
    <form action={action} className="space-y-4">
      <TemplateFields state={state} />
      <Button disabled={pending} type="submit">
        {pending ? "Creating..." : "Create Template"}
      </Button>
    </form>
  );
}

export function EditGiftCardTemplateForm({ template }: { template: Template }) {
  const [state, action, pending] = useActionState(updateGiftCardTemplateAction, emptyActionState);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <input type="hidden" name="id" value={template.id} />
      <div>
        <h3 className="font-display text-lg font-semibold">{template.name}</h3>
        <p className="text-sm text-primary">{formatCurrency(template.amount)}</p>
      </div>
      <TemplateFields template={template} state={state} />
      <Button disabled={pending} type="submit" variant="secondary">
        {pending ? "Saving..." : "Save Template"}
      </Button>
    </form>
  );
}

export function CancelGiftCardButton({ id, disabled }: { id: string; disabled: boolean }) {
  return (
    <form action={cancelGiftCardAction}>
      <input type="hidden" name="id" value={id} />
      <Button disabled={disabled} type="submit" variant="danger">
        Cancel
      </Button>
    </form>
  );
}

function TemplateFields({
  template,
  state
}: {
  template?: Template;
  state: {
    ok?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
  };
}) {
  return (
    <>
      <FormMessage message={state.message} ok={state.ok} />
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClasses}>Name</label>
          <input className={inputClasses} name="name" defaultValue={template?.name ?? ""} />
          <FieldError messages={state.errors?.name} />
        </div>
        <div>
          <label className={labelClasses}>Amount</label>
          <input
            className={inputClasses}
            name="amount"
            type="number"
            min="1"
            step="0.01"
            defaultValue={template?.amount ?? ""}
          />
          <FieldError messages={state.errors?.amount} />
        </div>
      </div>
      <div>
        <label className={labelClasses}>Image URL or path</label>
        <input
          className={inputClasses}
          name="imageUrl"
          defaultValue={template?.imageUrl ?? "/images/gift-cards/25 dollar gift card.jpg"}
        />
        <FieldError messages={state.errors?.imageUrl} />
      </div>
      <div>
        <label className={labelClasses}>Description</label>
        <textarea
          className={inputClasses}
          name="description"
          rows={3}
          defaultValue={template?.description ?? ""}
        />
        <FieldError messages={state.errors?.description} />
      </div>
      <label className="flex items-center gap-3 text-sm text-on-surface-variant">
        <input name="isActive" type="checkbox" defaultChecked={template?.isActive ?? true} />
        Active option
      </label>
    </>
  );
}
