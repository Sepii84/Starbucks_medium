"use client";

import { useActionState } from "react";
import { chargeWalletAction } from "@/app/actions/wallet";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import { emptyActionState } from "@/lib/utils";

export function WalletChargeForm() {
  const [state, action, pending] = useActionState(chargeWalletAction, emptyActionState);

  return (
    <form action={action} className="space-y-4">
      <FormMessage message={state.message} ok={state.ok} />
      <div>
        <label className={labelClasses}>Charge amount</label>
        <input
          className={inputClasses}
          name="amount"
          type="number"
          min="1"
          max="500"
          step="0.01"
          placeholder="25.00"
        />
        <FieldError messages={state.errors?.amount} />
      </div>
      <p className="text-xs leading-5 text-on-surface-variant">
        This is fake in-website wallet balance for local testing only. No real payment
        processor is connected.
      </p>
      <Button disabled={pending} type="submit">
        {pending ? "Charging..." : "Charge Wallet"}
      </Button>
    </form>
  );
}
