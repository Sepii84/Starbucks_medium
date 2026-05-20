"use client";

import { useActionState } from "react";
import {
  adjustUserPointsAction,
  createRewardRuleAction,
  deleteRewardRuleAction,
  updateRewardRuleAction
} from "@/app/actions/rewards";
import { Button } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import { emptyActionState } from "@/lib/utils";

type MenuItemOption = {
  id: string;
  name: string;
};

type RewardRule = {
  id: string;
  menuItemId: string;
  itemName: string;
  pointsRequired: number;
  isActive: boolean;
  redemptionCount: number;
};

type UserOption = {
  id: string;
  name: string;
  email: string;
  rewardPoints: number;
};

function MenuItemSelect({
  menuItems,
  defaultValue
}: {
  menuItems: MenuItemOption[];
  defaultValue?: string;
}) {
  return (
    <select className={inputClasses} name="menuItemId" defaultValue={defaultValue}>
      <option value="">Choose menu item</option>
      {menuItems.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  );
}

export function CreateRewardRuleForm({ menuItems }: { menuItems: MenuItemOption[] }) {
  const [state, action, pending] = useActionState(createRewardRuleAction, emptyActionState);

  return (
    <form action={action} className="space-y-4">
      <FormMessage message={state.message} ok={state.ok} />
      <div>
        <label className={labelClasses}>Menu item</label>
        <MenuItemSelect menuItems={menuItems} />
        <FieldError messages={state.errors?.menuItemId} />
      </div>
      <div>
        <label className={labelClasses}>Points required</label>
        <input className={inputClasses} name="pointsRequired" type="number" min="1" />
        <FieldError messages={state.errors?.pointsRequired} />
      </div>
      <label className="flex items-center gap-3 text-sm text-on-surface-variant">
        <input name="isActive" type="checkbox" defaultChecked />
        Active reward
      </label>
      <Button disabled={pending} type="submit">
        {pending ? "Creating..." : "Create Reward"}
      </Button>
    </form>
  );
}

export function EditRewardRuleForm({
  rule,
  menuItems
}: {
  rule: RewardRule;
  menuItems: MenuItemOption[];
}) {
  const [state, action, pending] = useActionState(updateRewardRuleAction, emptyActionState);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <input type="hidden" name="id" value={rule.id} />
      <FormMessage message={state.message} ok={state.ok} />
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">{rule.itemName}</h3>
          <p className="text-sm text-on-surface-variant">
            {rule.redemptionCount} redemptions
          </p>
        </div>
        <Button
          formAction={deleteRewardRuleAction}
          type="submit"
          variant="danger"
          disabled={rule.redemptionCount > 0}
        >
          Delete
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClasses}>Menu item</label>
          <MenuItemSelect menuItems={menuItems} defaultValue={rule.menuItemId} />
        </div>
        <div>
          <label className={labelClasses}>Points required</label>
          <input
            className={inputClasses}
            name="pointsRequired"
            type="number"
            min="1"
            defaultValue={rule.pointsRequired}
          />
          <FieldError messages={state.errors?.pointsRequired} />
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm text-on-surface-variant">
        <input name="isActive" type="checkbox" defaultChecked={rule.isActive} />
        Active reward
      </label>
      <Button disabled={pending} type="submit" variant="secondary">
        {pending ? "Saving..." : "Save Reward"}
      </Button>
    </form>
  );
}

export function AdjustPointsForm({ users }: { users: UserOption[] }) {
  const [state, action, pending] = useActionState(adjustUserPointsAction, emptyActionState);

  return (
    <form action={action} className="space-y-4">
      <FormMessage message={state.message} ok={state.ok} />
      <div>
        <label className={labelClasses}>User</label>
        <select className={inputClasses} name="userId">
          <option value="">Choose user</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email}) - {user.rewardPoints} pts
            </option>
          ))}
        </select>
        <FieldError messages={state.errors?.userId} />
      </div>
      <div>
        <label className={labelClasses}>Point adjustment</label>
        <input className={inputClasses} name="points" type="number" placeholder="25 or -25" />
        <FieldError messages={state.errors?.points} />
      </div>
      <div>
        <label className={labelClasses}>Reason</label>
        <textarea className={inputClasses} name="reason" rows={3} />
        <FieldError messages={state.errors?.reason} />
      </div>
      <Button disabled={pending} type="submit">
        {pending ? "Adjusting..." : "Adjust Points"}
      </Button>
    </form>
  );
}
