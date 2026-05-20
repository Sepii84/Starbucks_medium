"use client";

import { useActionState } from "react";
import { adminAdjustWalletAction } from "@/app/actions/wallet";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import { emptyActionState, formatCurrency } from "@/lib/utils";

type UserOption = {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
};

export function AdminWalletAdjustmentForm({ users }: { users: UserOption[] }) {
  const [state, action, pending] = useActionState(adminAdjustWalletAction, emptyActionState);

  return (
    <form action={action} className="space-y-4">
      <FormMessage message={state.message} ok={state.ok} />
      <div>
        <label className={labelClasses}>User</label>
        <select className={inputClasses} name="userId">
          <option value="">Choose user</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email}) - {formatCurrency(user.walletBalance)}
            </option>
          ))}
        </select>
        <FieldError messages={state.errors?.userId} />
      </div>
      <div>
        <label className={labelClasses}>Amount adjustment</label>
        <input
          className={inputClasses}
          name="amount"
          type="number"
          step="0.01"
          placeholder="20.00 or -20.00"
        />
        <FieldError messages={state.errors?.amount} />
      </div>
      <div>
        <label className={labelClasses}>Reason</label>
        <textarea className={inputClasses} name="reason" rows={3} />
        <FieldError messages={state.errors?.reason} />
      </div>
      <Button disabled={pending} type="submit">
        {pending ? "Adjusting..." : "Adjust Wallet"}
      </Button>
    </form>
  );
}
