import { Award, History, Sparkles, Users } from "lucide-react";
import {
  AdjustPointsForm,
  CreateRewardRuleForm,
  EditRewardRuleForm
} from "@/components/admin/AdminRewardsForms";
import { GlassCard } from "@/components/ui/GlassCard";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminRewardsPage() {
  const [rules, menuItems, redemptions, transactions, users] = await Promise.all([
    prisma.rewardRule.findMany({
      include: {
        menuItem: true,
        _count: { select: { redemptions: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.menuItem.findMany({
      where: { isAvailable: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    }),
    prisma.rewardRedemption.findMany({
      take: 12,
      include: {
        user: { select: { id: true, name: true, email: true } },
        menuItem: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.rewardTransaction.findMany({
      take: 14,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.findMany({
      where: { role: "USER", isActive: true },
      select: { id: true, name: true, email: true, rewardPoints: true },
      orderBy: { rewardPoints: "desc" },
      take: 20
    })
  ]);

  const cards = [
    { label: "Reward rules", value: rules.length, icon: Award },
    { label: "Active rewards", value: rules.filter((rule) => rule.isActive).length, icon: Sparkles },
    { label: "Redemptions", value: redemptions.length, icon: History },
    { label: "Top users", value: users.length, icon: Users }
  ];

  const simpleRules = rules.map((rule) => ({
    id: rule.id,
    menuItemId: rule.menuItemId,
    itemName: rule.menuItem.name,
    pointsRequired: rule.pointsRequired,
    isActive: rule.isActive,
    redemptionCount: rule._count.redemptions
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase text-primary">Rewards</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold uppercase">
          Reward control
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-8">
          <GlassCard className="p-5">
            <h2 className="mb-5 font-display text-2xl font-semibold">Create reward</h2>
            <CreateRewardRuleForm menuItems={menuItems} />
          </GlassCard>
          <GlassCard className="p-5">
            <h2 className="mb-5 font-display text-2xl font-semibold">Adjust user points</h2>
            <AdjustPointsForm users={users} />
          </GlassCard>
          <GlassCard className="p-5">
            <h2 className="mb-5 font-display text-2xl font-semibold">Highest points</h2>
            <div className="space-y-3">
              {users.slice(0, 8).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm"
                >
                  <span>
                    {user.name}
                    <span className="block text-xs text-on-surface-variant">{user.email}</span>
                  </span>
                  <span className="text-primary">{user.rewardPoints} pts</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-8">
          <GlassCard className="p-5">
            <h2 className="mb-5 font-display text-2xl font-semibold">Reward rules</h2>
            <div className="space-y-4">
              {simpleRules.length ? (
                simpleRules.map((rule) => (
                  <EditRewardRuleForm key={rule.id} rule={rule} menuItems={menuItems} />
                ))
              ) : (
                <p className="text-on-surface-variant">No reward rules yet.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="mb-5 font-display text-2xl font-semibold">Recent redemptions</h2>
            <div className="space-y-3">
              {redemptions.length ? (
                redemptions.map((redemption) => (
                  <div
                    key={redemption.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm"
                  >
                    <p className="text-primary">
                      {redemption.user.name} redeemed {redemption.menuItem.name}
                    </p>
                    <p className="mt-1 text-on-surface-variant">
                      {redemption.pointsSpent} pts - {redemption.status} -{" "}
                      {formatDate(redemption.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-on-surface-variant">No redemptions yet.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="mb-5 font-display text-2xl font-semibold">Point history</h2>
            <div className="space-y-3">
              {transactions.length ? (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-primary">{transaction.user.name}</p>
                        <p className="text-on-surface-variant">{transaction.description}</p>
                      </div>
                      <p className="font-mono text-xs uppercase text-primary">
                        {transaction.type} {transaction.points}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-on-surface-variant">No point transactions yet.</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
