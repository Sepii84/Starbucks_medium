import { ArrowDownCircle, ArrowUpCircle, History, WalletCards } from "lucide-react";
import { WalletChargeForm } from "@/components/wallet/WalletChargeForm";
import { GlassCard } from "@/components/ui/GlassCard";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const user = await requireUser();
  const transactions = await prisma.walletTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 60
  });

  const totalCharged = transactions
    .filter((transaction) => transaction.type === "CHARGE")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const totalSpent = transactions
    .filter((transaction) => Number(transaction.amount) < 0)
    .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0);
  const totalReceived = transactions
    .filter((transaction) => transaction.type === "GIFT_CARD_RECEIVED")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const cards = [
    {
      label: "Current balance",
      value: formatCurrency(Number(user.walletBalance)),
      icon: WalletCards
    },
    {
      label: "Total charged",
      value: formatCurrency(totalCharged),
      icon: ArrowUpCircle
    },
    {
      label: "Total spent",
      value: formatCurrency(totalSpent),
      icon: ArrowDownCircle
    },
    {
      label: "Transactions",
      value: transactions.length.toString(),
      icon: History
    },
    {
      label: "Gift card received",
      value: formatCurrency(totalReceived),
      icon: WalletCards
    }
  ];

  return (
    <section className="px-5 py-14 md:px-16">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase text-primary">
            Wallet
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase md:text-6xl">
            In-website balance
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-on-surface-variant">
            Charge fake wallet balance, pay for orders, buy gift cards, and review
            every balance change in one place.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
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
                <card.icon className="text-primary" size={24} />
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <GlassCard className="h-fit p-6">
            <h2 className="font-display text-2xl font-semibold">Charge wallet</h2>
            <div className="mt-5">
              <WalletChargeForm />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="font-display text-2xl font-semibold">Transaction history</h2>
            <div className="mt-5 hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="font-mono text-[10px] uppercase text-on-surface-variant">
                  <tr className="border-b border-white/10">
                    <th className="py-3">Date</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">Balance</th>
                    <th className="py-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-white/5">
                      <td className="py-3 text-on-surface-variant">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="py-3">{transaction.type.replaceAll("_", " ")}</td>
                      <td
                        className={cn(
                          "py-3",
                          Number(transaction.amount) >= 0 ? "text-primary" : "text-red-100"
                        )}
                      >
                        {formatCurrency(Number(transaction.amount))}
                      </td>
                      <td className="py-3 text-primary">
                        {formatCurrency(Number(transaction.balanceAfter))}
                      </td>
                      <td className="py-3 text-on-surface-variant">
                        {transaction.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-3 md:hidden">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase text-primary">
                        {transaction.type.replaceAll("_", " ")}
                      </p>
                      <p className="mt-2 text-xs text-on-surface-variant">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "font-display text-lg font-semibold",
                        Number(transaction.amount) >= 0 ? "text-primary" : "text-red-100"
                      )}
                    >
                      {formatCurrency(Number(transaction.amount))}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-on-surface-variant">
                    {transaction.description}
                  </p>
                  <p className="mt-2 text-sm text-primary">
                    Balance after {formatCurrency(Number(transaction.balanceAfter))}
                  </p>
                </div>
              ))}
            </div>

            {!transactions.length && (
              <p className="mt-5 text-on-surface-variant">No wallet transactions yet.</p>
            )}
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
