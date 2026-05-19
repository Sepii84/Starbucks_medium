import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    include: { order: true }
  });
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase text-primary">
            Notifications
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase">
            Admin alerts
          </h1>
        </div>
        <form action={markAllNotificationsReadAction}>
          <Button disabled={unreadCount === 0} type="submit" variant="secondary">
            Mark all read
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        {notifications.length ? (
          notifications.map((notification) => (
            <GlassCard key={notification.id} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className={notification.isRead ? "text-on-surface-variant" : "text-primary"}>
                    {notification.message}
                  </p>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {formatDate(notification.createdAt)}
                    {notification.orderId
                      ? ` · Order #${notification.orderId.slice(-8).toUpperCase()}`
                      : ""}
                  </p>
                </div>
                {!notification.isRead && (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="id" value={notification.id} />
                    <Button type="submit" variant="ghost">
                      Mark read
                    </Button>
                  </form>
                )}
              </div>
            </GlassCard>
          ))
        ) : (
          <GlassCard className="p-8 text-on-surface-variant">No notifications yet.</GlassCard>
        )}
      </div>
    </div>
  );
}
