"use client";

import { useActionState } from "react";
import { cancelMockTopUpAction, confirmMockTopUpAction } from "@/app/actions/wallet";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/Form";
import { emptyActionState, formatCurrency } from "@/lib/utils";

export function MockTopUpConfirmForm({
  topUpId,
  amount
}: {
  topUpId: string;
  amount: number;
}) {
  const [state, action, pending] = useActionState(confirmMockTopUpAction, emptyActionState);

  return (
    <div className="space-y-4">
      <FormMessage message={state.message} ok={state.ok} />
      <form action={action} className="space-y-4">
        <input type="hidden" name="topUpId" value={topUpId} />
        <Button disabled={pending} type="submit">
          {pending ? "Confirming mock payment..." : `Confirm demo top-up ${formatCurrency(amount)}`}
        </Button>
      </form>
      <form action={cancelMockTopUpAction}>
        <input type="hidden" name="topUpId" value={topUpId} />
        <Button disabled={pending} type="submit" variant="secondary">
          Cancel top-up
        </Button>
      </form>
    </div>
  );
}
