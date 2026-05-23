"use client";

import { Pencil, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { updateProfileAction } from "@/app/actions/user";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import type { ClientUser } from "@/lib/serializers";
import { emptyActionState } from "@/lib/utils";

export function ProfileForm({
  user
}: {
  user: Pick<ClientUser, "name" | "email" | "phone" | "address">;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, emptyActionState);
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      setIsEditing(false);
    }
  }, [state.ok]);

  function cancelEdit() {
    formRef.current?.reset();
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
      className="space-y-5"
    >
      <FormMessage message={state.message} ok={state.ok} />
      <div className="flex justify-end">
        {!isEditing ? (
          <button
            type="button"
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 font-mono text-[11px] font-bold uppercase text-primary transition hover:bg-primary/15"
            onClick={() => setIsEditing(true)}
            aria-label="Edit profile"
          >
            <Pencil size={14} />
            Edit
          </button>
        ) : (
          <button
            type="button"
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 font-mono text-[11px] font-bold uppercase text-on-surface-variant transition hover:text-primary"
            onClick={cancelEdit}
          >
            <X size={14} />
            Cancel
          </button>
        )}
      </div>
      <div>
        <label className={labelClasses} htmlFor="name">
          Name
        </label>
        <input
          className={inputClasses}
          id="name"
          name="name"
          defaultValue={user.name ?? ""}
          readOnly={!isEditing}
          required
        />
        <FieldError messages={state.errors?.name} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="email">
          Email
        </label>
        <input className={inputClasses} id="email" value={user.email} readOnly />
        <p className="mt-2 text-xs text-on-surface-variant">
          Email changes are handled by support for user accounts.
        </p>
      </div>
      <div>
        <label className={labelClasses} htmlFor="phone">
          Phone
        </label>
        <input
          className={inputClasses}
          id="phone"
          name="phone"
          defaultValue={user.phone ?? ""}
          readOnly={!isEditing}
        />
        <FieldError messages={state.errors?.phone} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="address">
          Address
        </label>
        <textarea
          className={inputClasses}
          id="address"
          name="address"
          rows={4}
          defaultValue={user.address ?? ""}
          readOnly={!isEditing}
        />
        <FieldError messages={state.errors?.address} />
      </div>
      {isEditing && (
        <Button disabled={pending} type="submit">
          {pending ? "Saving..." : "Save Profile"}
        </Button>
      )}
    </form>
  );
}
