"use client";

import { Pencil, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { updateAdminAccountAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import type { ClientUser } from "@/lib/serializers";
import { emptyActionState } from "@/lib/utils";

export function AdminAccountForm({
  admin
}: {
  admin: Pick<ClientUser, "name" | "email">;
}) {
  const [state, action, pending] = useActionState(updateAdminAccountAction, emptyActionState);
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
            aria-label="Edit admin account"
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
          defaultValue={admin.name ?? ""}
          readOnly={!isEditing}
        />
        <FieldError messages={state.errors?.name} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="email">
          Email
        </label>
        <input
          className={inputClasses}
          id="email"
          name="email"
          defaultValue={admin.email}
          readOnly={!isEditing}
        />
        <FieldError messages={state.errors?.email} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="currentPassword">
            Current password
          </label>
          <input
            className={inputClasses}
            id="currentPassword"
            name="currentPassword"
            type="password"
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className={labelClasses} htmlFor="newPassword">
            New password
          </label>
          <input
            className={inputClasses}
            id="newPassword"
            name="newPassword"
            type="password"
            readOnly={!isEditing}
          />
          <FieldError messages={state.errors?.newPassword} />
        </div>
      </div>
      {isEditing && (
        <Button disabled={pending} type="submit">
          {pending ? "Saving..." : "Update Admin Account"}
        </Button>
      )}
    </form>
  );
}
