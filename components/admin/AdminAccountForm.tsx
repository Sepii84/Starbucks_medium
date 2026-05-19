"use client";

import { useActionState } from "react";
import { updateAdminAccountAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import { emptyActionState } from "@/lib/utils";

export function AdminAccountForm({
  admin
}: {
  admin: {
    name: string;
    email: string;
  };
}) {
  const [state, action, pending] = useActionState(updateAdminAccountAction, emptyActionState);

  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state.message} ok={state.ok} />
      <div>
        <label className={labelClasses} htmlFor="name">
          Name
        </label>
        <input className={inputClasses} id="name" name="name" defaultValue={admin.name} />
        <FieldError messages={state.errors?.name} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="email">
          Email
        </label>
        <input className={inputClasses} id="email" name="email" defaultValue={admin.email} />
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
          />
          <FieldError messages={state.errors?.newPassword} />
        </div>
      </div>
      <Button disabled={pending} type="submit">
        {pending ? "Saving..." : "Update Admin Account"}
      </Button>
    </form>
  );
}
