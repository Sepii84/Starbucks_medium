"use client";

import { Pencil, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  cancelGiftCardAction,
  createGiftCardTemplateAction,
  updateGiftCardTemplateAction
} from "@/app/actions/gift-cards";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
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
        {pending ? "Uploading / creating..." : "Create Template"}
      </Button>
    </form>
  );
}

export function EditGiftCardTemplateForm({ template }: { template: Template }) {
  const [state, action, pending] = useActionState(updateGiftCardTemplateAction, emptyActionState);
  const [isEditing, setIsEditing] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      setIsEditing(false);
    }
  }, [state.ok]);

  function cancelEdit() {
    formRef.current?.reset();
    setResetVersion((value) => value + 1);
    setIsEditing(false);
  }

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={(event) => {
        if (!isEditing) {
          event.preventDefault();
        }
      }}
      className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
    >
      <input type="hidden" name="id" value={template.id} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">{template.name}</h3>
          <p className="text-sm text-primary">{formatCurrency(template.amount)}</p>
        </div>
        {!isEditing ? (
          <button
            type="button"
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 font-mono text-[10px] font-bold uppercase text-primary transition hover:bg-primary/15"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit ${template.name}`}
          >
            <Pencil size={13} />
            Edit
          </button>
        ) : (
          <button
            type="button"
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 font-mono text-[10px] font-bold uppercase text-on-surface-variant transition hover:text-primary"
            onClick={cancelEdit}
          >
            <X size={13} />
            Cancel
          </button>
        )}
      </div>
      <TemplateFields
        key={`${template.id}-${resetVersion}`}
        template={template}
        state={state}
        disabled={!isEditing}
      />
      {isEditing && (
        <Button disabled={pending} type="submit" variant="secondary">
          {pending ? "Uploading / saving..." : "Save Template"}
        </Button>
      )}
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
  state,
  disabled = false
}: {
  template?: Template;
  state: {
    ok?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
  };
  disabled?: boolean;
}) {
  return (
    <>
      <FormMessage message={state.message} ok={state.ok} />
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClasses}>Name</label>
          <input
            className={inputClasses}
            name="name"
            defaultValue={template?.name ?? ""}
            readOnly={disabled}
          />
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
            readOnly={disabled}
          />
          <FieldError messages={state.errors?.amount} />
        </div>
      </div>
      <ImageUploadField
        folder="gift-cards"
        defaultValue={template?.imageUrl ?? "/images/gift-cards/25 dollar gift card.jpg"}
        errors={state.errors?.imageUrl}
        nameHint={template?.name ?? "gift-card-template"}
        disabled={disabled}
      />
      <div>
        <label className={labelClasses}>Description</label>
        <textarea
          className={inputClasses}
          name="description"
          rows={3}
          defaultValue={template?.description ?? ""}
          readOnly={disabled}
        />
        <FieldError messages={state.errors?.description} />
      </div>
      <label className="flex items-center gap-3 text-sm text-on-surface-variant">
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={template?.isActive ?? true}
          disabled={disabled}
        />
        Active option
      </label>
    </>
  );
}
