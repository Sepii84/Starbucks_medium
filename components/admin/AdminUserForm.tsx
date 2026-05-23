"use client";

import { Role } from "@prisma/client";
import { Pencil, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { deactivateUserAction, updateUserAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import type { ClientUser } from "@/lib/serializers";
import { emptyActionState } from "@/lib/utils";

type AdminUser = Pick<
  ClientUser,
  "id" | "name" | "email" | "phone" | "address" | "role" | "isActive"
>;

export function AdminUserForm({
  user,
  currentAdminId
}: {
  user: AdminUser;
  currentAdminId: string;
}) {
  const [state, action, pending] = useActionState(updateUserAction, emptyActionState);
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isSelf = user.id === currentAdminId;

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
      className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
    >
      <input type="hidden" name="id" value={user.id} />
      <FormMessage message={state.message} ok={state.ok} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">{user.name}</h3>
          <p className="text-sm text-on-surface-variant">{user.email}</p>
        </div>
        {!isEditing ? (
          <button
            type="button"
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 font-mono text-[10px] font-bold uppercase text-primary transition hover:bg-primary/15"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit ${user.name}`}
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
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClasses}>Name</label>
          <input
            className={inputClasses}
            name="name"
            defaultValue={user.name ?? ""}
            readOnly={!isEditing}
          />
          <FieldError messages={state.errors?.name} />
        </div>
        <div>
          <label className={labelClasses}>Email</label>
          <input
            className={inputClasses}
            name="email"
            defaultValue={user.email}
            readOnly={!isEditing}
          />
          <FieldError messages={state.errors?.email} />
        </div>
        <div>
          <label className={labelClasses}>Phone</label>
          <input
            className={inputClasses}
            name="phone"
            defaultValue={user.phone ?? ""}
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className={labelClasses}>Role</label>
          <select
            className={inputClasses}
            name="role"
            defaultValue={user.role}
            disabled={!isEditing}
          >
            {Object.values(Role).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClasses}>Address</label>
        <textarea
          className={inputClasses}
          name="address"
          rows={2}
          defaultValue={user.address ?? ""}
          readOnly={!isEditing}
        />
      </div>
      <label className="flex items-center gap-3 text-sm text-on-surface-variant">
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={user.isActive}
          disabled={!isEditing || isSelf}
        />
        Active account {isSelf ? "(your account is protected)" : ""}
      </label>
      {isEditing && (
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} type="submit" variant="secondary">
            {pending ? "Saving..." : "Save User"}
          </Button>
          {!isSelf && (
            <Button formAction={deactivateUserAction} type="submit" variant="danger">
              Deactivate
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
