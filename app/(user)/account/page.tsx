import { ProfileForm } from "@/components/account/ProfileForm";
import { GlassCard } from "@/components/ui/GlassCard";
import { requireUserSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeUserForClient } from "@/lib/serializers";
import { formatCurrency, formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const [session, params] = await Promise.all([requireUserSession(), searchParams]);
  const [user, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        rewardPoints: true,
        walletBalance: true,
        isActive: true
      }
    }),
    prisma.order.findMany({
      where: { userId: session.userId },
      select: {
        id: true,
        status: true,
        orderType: true,
        totalPrice: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            menuItem: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  if (!user?.isActive || user.role !== "USER") {
    redirect("/login?message=Please sign in to continue.");
  }

  const clientUser = serializeUserForClient(user);

  return (
    <section className="px-5 py-14 md:px-16">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard className="p-6">
          <div className="mb-8">
            <p className="font-mono text-[11px] font-bold uppercase text-primary">
              User account
            </p>
            <h1 className="mt-3 font-display text-3xl font-extrabold uppercase">
              Profile
            </h1>
            {params.message && (
              <p className="mt-3 rounded-lg border border-primary/25 bg-primary/10 p-3 text-sm text-primary">
                {params.message}
              </p>
            )}
          </div>
          <ProfileForm user={clientUser} />
        </GlassCard>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <GlassCard className="p-5">
              <p className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                Reward points
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-primary">
                {user.rewardPoints}
              </p>
            </GlassCard>
            <GlassCard className="p-5">
              <p className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                Wallet balance
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-primary">
                {formatCurrency(Number(user.walletBalance))}
              </p>
            </GlassCard>
          </div>
          <div>
            <p className="font-mono text-[11px] font-bold uppercase text-primary">
              Recent orders
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Your order history</h2>
          </div>
          {orders.length ? (
            orders.map((order) => (
              <GlassCard key={order.id} className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase text-primary">
                      {order.status} · {order.orderType.replace("_", " ")}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-semibold">
                      {formatCurrency(Number(order.totalPrice))}
                    </h3>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {order.items
                      .map((item) => `${item.quantity}x ${item.menuItem.name}`)
                      .join(", ")}
                  </p>
                </div>
              </GlassCard>
            ))
          ) : (
            <GlassCard className="p-6 text-on-surface-variant">
              You have not placed an order yet.
            </GlassCard>
          )}
        </div>
      </div>
    </section>
  );
}
