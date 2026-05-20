"use client";

import { useActionState } from "react";
import { redeemRewardAction } from "@/app/actions/rewards";
import { Button, LinkButton } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/Form";
import { emptyActionState } from "@/lib/utils";

export function RewardRedeemForm({
  rewardRuleId,
  eligible,
  loggedIn,
  missingPoints
}: {
  rewardRuleId: string;
  eligible: boolean;
  loggedIn: boolean;
  missingPoints: number;
}) {
  const [state, action, pending] = useActionState(redeemRewardAction, emptyActionState);

  if (!loggedIn) {
    return (
      <LinkButton href="/login?message=Please sign in to redeem rewards." variant="secondary" className="w-full">
        Login to redeem
      </LinkButton>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="rewardRuleId" value={rewardRuleId} />
      <FormMessage message={state.message} ok={state.ok} />
      <Button className="w-full" disabled={!eligible || pending} type="submit">
        {pending
          ? "Redeeming..."
          : eligible
            ? "Redeem Reward"
            : `${missingPoints} points needed`}
      </Button>
    </form>
  );
}
