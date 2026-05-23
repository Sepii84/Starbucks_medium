import { WalletTopUpStatus } from "@prisma/client";
import { redirect, notFound } from "next/navigation";
import { MockTopUpConfirmForm } from "@/components/wallet/MockTopUpConfirmForm";
import { GlassCard } from "@/components/ui/GlassCard";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MockTopUpConfirmPage({
  searchParams
}: {
  searchParams: Promise<{ topUpId?: string }>;
}) {
  const user = await requireUser();
  const topUpId = (await searchParams).topUpId;

  if (!topUpId) {
    redirect("/wallet");
  }

  const topUp = await prisma.walletTopUp.findUnique({
    where: { id: topUpId },
    include: { walletTransaction: true }
  });

  if (!topUp || topUp.userId !== user.id) {
    notFound();
  }

  if (topUp.status === WalletTopUpStatus.SUCCEEDED) {
    redirect(`/wallet/top-up/success?topUpId=${encodeURIComponent(topUp.id)}`);
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
            Mock payment
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase">
            Confirm demo top-up
          </h1>
          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm leading-6 text-on-surface-variant">
            <p className="font-semibold text-primary">
              This is a demo wallet top-up. No real payment is processed.
            </p>
            <p className="mt-2">
              This page does not ask for card, bank, or payment details. It only
              simulates a successful provider confirmation for testing.
            </p>
          </div>

          <dl className="mt-6 grid gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[10px] uppercase text-on-surface-variant">
                Amount
              </dt>
              <dd className="mt-2 font-display text-2xl font-semibold text-primary">
                {formatCurrency(Number(topUp.amount))}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-on-surface-variant">
                Provider
              </dt>
              <dd className="mt-2 text-sm">{topUp.provider}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-on-surface-variant">
                Status
              </dt>
              <dd className="mt-2 text-sm">{topUp.status}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-on-surface-variant">
                Created
              </dt>
              <dd className="mt-2 text-sm">{formatDate(topUp.createdAt)}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <MockTopUpConfirmForm topUpId={topUp.id} amount={Number(topUp.amount)} />
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
