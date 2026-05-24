"use client";

import { OrderStatus } from "@prisma/client";
import { updateOrderStatusAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { selectClasses } from "@/components/ui/Form";

const statuses = Object.values(OrderStatus);

export function AdminOrderStatusForm({
  id,
  status
}: {
  id: string;
  status: OrderStatus;
}) {
  return (
    <form action={updateOrderStatusAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select className={`${selectClasses} w-auto min-w-40`} name="status" defaultValue={status}>
        {statuses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <Button type="submit" variant="secondary">
        Update
      </Button>
    </form>
  );
}
