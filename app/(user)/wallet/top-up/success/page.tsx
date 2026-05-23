import { WalletTopUpStatus } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { LinkButton } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TopUpSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ topUpId?: string }>;
}) {
  const user = await requireUser();
  const topUpId = (await searchParams).topUpId;

  if (!topUpId) {
    notFound();
  }

  const topUp = await prisma.walletTopUp.findUnique({
    where: { id: topUpId },
    include: { walletTransaction: true }
  });

  if (!topUp || topUp.userId !== user.id) {
    notFound();
  }

  if (topUp.status === WalletTopUpStatus.PENDING) {
    redirect(`/wallet/top-up/mock-confirm?topUpId=${encodeURIComponent(topUp.id)}`);
  }

  if (topUp.status === WalletTopUpStatus.CANCELED) {
    redirect(`/wallet/top-up/cancel?topUpId=${encodeURIComponent(topUp.id)}`);
  }

  if (topUp.status === WalletTopUpStatus.FAILED) {
    redirect(`/wallet/top-up/failed?topUpId=${encodeURIComponent(topUp.id)}`);
  }

  return (
    <section className="px-5 py-14 md:px-16">
      <div className="mx-auto max-w-3xl">
        <GlassCard className="p-6 md:p-8">
          <p className="font-mono text-[11px] font-bold uppercase text-primary">
            Demo top-up
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase">
            Wallet updated
          </h1>
          <p className="mt-5 text-on-surface-variant">
            This was a mock confirmation only. No real payment was processed and
            no payment details were requested.
          </p>

          <dl className="mt-6 grid gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[10px] uppercase text-on-surface-variant">
                Amount added
              </dt>
              <dd className="mt-2 font-display text-2xl font-semibold text-primary">
                {formatCurrency(Number(topUp.amount))}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-on-surface-variant">
                Balance after
              </dt>
              <dd className="mt-2 font-display text-2xl font-semibold text-primary">
                {topUp.walletTransaction
                  ? formatCurrency(Number(topUp.walletTransaction.balanceAfter))
                  : "Already confirmed"}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-on-surface-variant">
                Reference
              </dt>
              <dd className="mt-2 break-all text-sm">{topUp.id}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-on-surface-variant">
                Confirmed
              </dt>
              <dd className="mt-2 text-sm">
                {topUp.confirmedAt ? formatDate(topUp.confirmedAt) : topUp.status}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/wallet">Back to wallet</LinkButton>
            <LinkButton href="/menu" variant="secondary">
              Open menu
            </LinkButton>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
