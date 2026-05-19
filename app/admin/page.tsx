import Link from "next/link";
import { Bell, CheckCircle2, Clock, DollarSign, ShoppingBag, Users } from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { getDashboardStats } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const cards = [
    { label: "Total orders", value: stats.totalOrders, icon: ShoppingBag },
    { label: "Pending", value: stats.pendingOrders, icon: Clock },
    { label: "Completed", value: stats.completedOrders, icon: CheckCircle2 },
    { label: "Users", value: stats.totalUsers, icon: Users },
    { label: "Revenue", value: formatCurrency(stats.totalRevenue), icon: DollarSign }
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase text-primary">Dashboard</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold uppercase">Command center</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <GlassCard key={card.label} className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                  {card.label}
                </p>
                <p className="mt-3 font-display text-3xl font-semibold text-primary">
                  {card.value}
                </p>
              </div>
              <card.icon className="text-primary" size={24} />
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold">Recent orders</h2>
            <Link className="text-sm text-primary hover:underline" href="/admin/orders">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {stats.recentOrders.length ? (
              stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <OrderStatusBadge status={order.status} />
                      <h3 className="mt-3 font-display text-lg font-semibold">
                        {order.customerName}
                      </h3>
                      <p className="text-sm text-on-surface-variant">{order.user.email}</p>
                    </div>
                    <div className="text-sm text-on-surface-variant md:text-right">
                      <p className="text-primary">{formatCurrency(Number(order.totalPrice))}</p>
                      <p>{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-on-surface-variant">No orders yet.</p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold">Notifications</h2>
            <Bell className="text-primary" size={20} />
          </div>
          <div className="space-y-3">
            {stats.notifications.length ? (
              stats.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className={notification.isRead ? "text-on-surface-variant" : "text-primary"}>
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-on-surface-variant">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-on-surface-variant">No notifications yet.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
