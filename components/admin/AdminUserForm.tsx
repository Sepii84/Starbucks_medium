"use client";

import { Role } from "@prisma/client";
import { useActionState } from "react";
import { deactivateUserAction, updateUserAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import { emptyActionState } from "@/lib/utils";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role: Role;
  isActive: boolean;
};

export function AdminUserForm({
  user,
  currentAdminId
}: {
  user: AdminUser;
  currentAdminId: string;
}) {
  const [state, action, pending] = useActionState(updateUserAction, emptyActionState);
  const isSelf = user.id === currentAdminId;

  return (
    <form action={action} className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <input type="hidden" name="id" value={user.id} />
      <FormMessage message={state.message} ok={state.ok} />
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClasses}>Name</label>
          <input className={inputClasses} name="name" defaultValue={user.name} />
          <FieldError messages={state.errors?.name} />
        </div>
        <div>
          <label className={labelClasses}>Email</label>
          <input className={inputClasses} name="email" defaultValue={user.email} />
          <FieldError messages={state.errors?.email} />
        </div>
        <div>
          <label className={labelClasses}>Phone</label>
          <input className={inputClasses} name="phone" defaultValue={user.phone ?? ""} />
        </div>
        <div>
          <label className={labelClasses}>Role</label>
          <select className={inputClasses} name="role" defaultValue={user.role}>
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
        <textarea className={inputClasses} name="address" rows={2} defaultValue={user.address ?? ""} />
      </div>
      <label className="flex items-center gap-3 text-sm text-on-surface-variant">
        <input name="isActive" type="checkbox" defaultChecked={user.isActive} disabled={isSelf} />
        Active account {isSelf ? "(your account is protected)" : ""}
      </label>
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
    </form>
  );
}
