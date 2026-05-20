import { Search, WalletCards } from "lucide-react";
import { AdminWalletAdjustmentForm } from "@/components/admin/AdminWalletForms";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { inputClasses } from "@/components/ui/Form";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminWalletPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const userWhere = {
    role: "USER" as const,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const [users, allUsers, transactions, balanceAggregate] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      select: { id: true, name: true, email: true, walletBalance: true },
      orderBy: { name: "asc" },
      take: 50
    }),
    prisma.user.findMany({
      where: { role: "USER", isActive: true },
      select: { id: true, name: true, email: true, walletBalance: true },
      orderBy: { name: "asc" }
    }),
    prisma.walletTransaction.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    prisma.user.aggregate({
      where: { role: "USER" },
      _sum: { walletBalance: true }
    })
  ]);

  const simpleUsers = allUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    walletBalance: Number(user.walletBalance)
  }));

  const totalCharged = transactions
    .filter((transaction) => transaction.type === "CHARGE")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const totalSpent = transactions
    .filter((transaction) => Number(transaction.amount) < 0)
    .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase text-primary">Wallet</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold uppercase">
          Wallet ledger
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Wallet users", value: allUsers.length },
          { label: "Total balance", value: formatCurrency(Number(balanceAggregate._sum.walletBalance ?? 0)) },
          { label: "Total charged", value: formatCurrency(totalCharged) },
          { label: "Total spent", value: formatCurrency(totalSpent) }
        ].map((card) => (
          <GlassCard key={card.label} className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                  {card.label}
                </p>
                <p className="mt-3 font-display text-2xl font-semibold text-primary">
                  {card.value}
                </p>
              </div>
              <WalletCards className="text-primary" size={24} />
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-8">
          <GlassCard className="p-5">
            <h2 className="mb-5 font-display text-2xl font-semibold">Adjust balance</h2>
            <AdminWalletAdjustmentForm users={simpleUsers} />
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="mb-5 font-display text-2xl font-semibold">Search users</h2>
            <form className="flex gap-2">
              <input
                className={inputClasses}
                name="q"
                defaultValue={q}
                placeholder="Name or email"
              />
              <Button type="submit" variant="secondary">
                <Search size={16} />
                Search
              </Button>
            </form>
            <div className="mt-5 space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-primary">{user.name}</p>
                      <p className="text-on-surface-variant">{user.email}</p>
                    </div>
                    <p className="font-display text-lg font-semibold text-primary">
                      {formatCurrency(Number(user.walletBalance))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-5">
          <h2 className="mb-5 font-display text-2xl font-semibold">Wallet transactions</h2>
          <div className="space-y-3">
            {transactions.length ? (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-primary">
                        {transaction.user.name} - {transaction.type.replaceAll("_", " ")}
                      </p>
                      <p className="text-on-surface-variant">{transaction.description}</p>
                    </div>
                    <div className="md:text-right">
                      <p className={Number(transaction.amount) >= 0 ? "text-primary" : "text-red-100"}>
                        {formatCurrency(Number(transaction.amount))}
                      </p>
                      <p className="text-on-surface-variant">
                        Balance {formatCurrency(Number(transaction.balanceAfter))}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-on-surface-variant">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-on-surface-variant">No wallet transactions yet.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
