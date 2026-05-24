import { AdminOrderStatusForm } from "@/components/admin/AdminOrderStatusForm";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      userId: true,
      customerName: true,
      orderType: true,
      tableNumber: true,
      deliveryAddress: true,
      paymentMethod: true,
      status: true,
      totalPrice: true,
      createdAt: true,
      user: {
        select: { id: true, name: true, email: true }
      },
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          subtotal: true,
          menuItem: {
            select: { id: true, name: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase text-primary">Orders</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold uppercase">Order control</h1>
      </div>

      <div className="space-y-5">
        {orders.length ? (
          orders.map((order) => (
            <GlassCard key={order.id} className="p-5">
              <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr_0.8fr]">
                <div>
                  <OrderStatusBadge status={order.status} />
                  <h2 className="mt-3 font-display text-xl font-semibold">
                    #{order.id.slice(-8).toUpperCase()}
                  </h2>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {order.user.name} · {order.user.email}
                  </p>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <p className="font-mono text-[10px] font-bold uppercase text-primary">
                    Ordered items
                  </p>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3">
                      <span className="text-on-surface-variant">
                        {item.quantity}x {item.menuItem.name}
                      </span>
                      <span>
                        {formatCurrency(Number(item.unitPrice))} ·{" "}
                        {formatCurrency(Number(item.subtotal))}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-3 font-display text-lg text-primary">
                    {formatCurrency(Number(order.totalPrice))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-black/15 p-4 text-sm text-on-surface-variant">
                    <p className="font-mono text-[10px] font-bold uppercase text-primary">
                      {order.orderType.replace("_", " ")}
                    </p>
                    <p className="mt-2">
                      {order.orderType === "DINE_IN"
                        ? `Table ${order.tableNumber}`
                        : order.deliveryAddress}
                    </p>
                    <p className="mt-2">Customer: {order.customerName}</p>
                    <p className="mt-2">Payment: {order.paymentMethod.replace("_", " ")}</p>
                  </div>
                  <AdminOrderStatusForm id={order.id} status={order.status} />
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <GlassCard className="p-8 text-on-surface-variant">No orders yet.</GlassCard>
        )}
      </div>
    </div>
  );
}
