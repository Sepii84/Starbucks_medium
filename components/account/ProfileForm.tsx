"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/user";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import { emptyActionState } from "@/lib/utils";

export function ProfileForm({
  user
}: {
  user: {
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
  };
}) {
  const [state, action, pending] = useActionState(updateProfileAction, emptyActionState);

  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state.message} ok={state.ok} />
      <div>
        <label className={labelClasses} htmlFor="name">
          Name
        </label>
        <input className={inputClasses} id="name" name="name" defaultValue={user.name} required />
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
        <input className={inputClasses} id="phone" name="phone" defaultValue={user.phone ?? ""} />
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
        />
        <FieldError messages={state.errors?.address} />
      </div>
      <Button disabled={pending} type="submit">
        {pending ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
