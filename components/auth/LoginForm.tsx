"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import { emptyActionState } from "@/lib/utils";

export function LoginForm({
  message,
  next
}: {
  message?: string;
  next?: string;
}) {
  const [state, action, pending] = useActionState(loginAction, emptyActionState);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <FormMessage message={state.message ?? message} ok={state.ok} />
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
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Entering..." : "Login"}
      </Button>
    </form>
  );
}
