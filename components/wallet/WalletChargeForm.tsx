"use client";

import { useActionState, useState } from "react";
import { startWalletTopUpAction } from "@/app/actions/wallet";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import { emptyActionState } from "@/lib/utils";

const presetAmounts = ["10", "25", "50", "100"];

export function WalletTopUpForm() {
  const [state, action, pending] = useActionState(startWalletTopUpAction, emptyActionState);
  const [amount, setAmount] = useState("25");

  return (
    <form action={action} className="space-y-4">
      <FormMessage message={state.message} ok={state.ok} />
      <div>
        <p className="mb-3 font-mono text-[10px] font-bold uppercase text-on-surface-variant">
          Preset demo amounts
        </p>
        <div className="grid grid-cols-2 gap-2">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              type="button"
              className="focus-ring rounded-full border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15"
              onClick={() => setAmount(preset)}
            >
              ${preset}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelClasses}>Custom top-up amount</label>
        <input
          className={inputClasses}
          name="amount"
          type="number"
          min="1"
          max="500"
          step="0.01"
          placeholder="25.00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <FieldError messages={state.errors?.amount} />
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-xs leading-5 text-on-surface-variant">
        <p className="font-semibold text-primary">
          This is a demo wallet top-up. No real payment is processed.
        </p>
        <p className="mt-2">
          You will be sent to an internal MOCK confirmation page. No card details,
          bank details, or real checkout session are used.
        </p>
      </div>
      <Button disabled={pending} type="submit">
        {pending ? "Starting mock top-up..." : "Add demo funds"}
      </Button>
    </form>
  );
}
