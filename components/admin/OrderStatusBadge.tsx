import { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const styles: Record<OrderStatus, string> = {
  PENDING: "border-amber/30 bg-amber/10 text-amber",
  PREPARING: "border-primary/30 bg-primary/10 text-primary",
  READY: "border-secondary/30 bg-secondary/10 text-secondary",
  COMPLETED: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
  CANCELLED: "border-red-300/30 bg-red-500/10 text-red-100"
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}
