"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import { emptyActionState } from "@/lib/utils";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, emptyActionState);

  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state.message} ok={state.ok} />
      <div>
        <label className={labelClasses} htmlFor="name">
          Name
        </label>
        <input className={inputClasses} id="name" name="name" required />
        <FieldError messages={state.errors?.name} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="email">
          Email
        </label>
        <input className={inputClasses} id="email" name="email" type="email" required />
        <FieldError messages={state.errors?.email} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="password">
          Password
        </label>
        <input className={inputClasses} id="password" name="password" type="password" required />
        <FieldError messages={state.errors?.password} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="phone">
          Phone
        </label>
        <input className={inputClasses} id="phone" name="phone" />
      </div>
      <div>
        <label className={labelClasses} htmlFor="address">
          Address
        </label>
        <textarea className={inputClasses} id="address" name="address" rows={3} />
      </div>
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Creating..." : "Create User Account"}
      </Button>
    </form>
  );
}
