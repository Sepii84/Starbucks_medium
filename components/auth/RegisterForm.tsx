"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import { emptyActionState } from "@/lib/utils";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, emptyActionState);

  return (
    <form action={action} className="space-y-5" aria-describedby="register-form-message">
      <div id="register-form-message">
        <FormMessage message={state.message} ok={state.ok} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="name">
          Name
        </label>
        <input
          aria-invalid={Boolean(state.errors?.name)}
          autoComplete="name"
          className={inputClasses}
          id="name"
          name="name"
          required
        />
        <FieldError messages={state.errors?.name} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="email">
          Email
        </label>
        <input
          aria-invalid={Boolean(state.errors?.email)}
          autoComplete="email"
          className={inputClasses}
          id="email"
          name="email"
          type="email"
          required
        />
        <FieldError messages={state.errors?.email} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="password">
          Password
        </label>
        <input
          aria-invalid={Boolean(state.errors?.password)}
          autoComplete="new-password"
          className={inputClasses}
          id="password"
          name="password"
          type="password"
          required
        />
        <FieldError messages={state.errors?.password} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="phone">
          Phone
        </label>
        <input className={inputClasses} id="phone" name="phone" autoComplete="tel" />
      </div>
      <div>
        <label className={labelClasses} htmlFor="address">
          Address
        </label>
        <textarea
          autoComplete="street-address"
          className={inputClasses}
          id="address"
          name="address"
          rows={3}
        />
      </div>
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Creating..." : "Create User Account"}
      </Button>
    </form>
  );
}
