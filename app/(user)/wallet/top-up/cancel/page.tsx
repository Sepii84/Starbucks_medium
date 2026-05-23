import { LinkButton } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TopUpCancelPage() {
  await requireUser();

  return (
    <section className="px-5 py-14 md:px-16">
      <div className="mx-auto max-w-3xl">
        <GlassCard className="p-6 md:p-8">
          <p className="font-mono text-[11px] font-bold uppercase text-primary">
            Demo top-up
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase">
            Top-up canceled
          </h1>
          <p className="mt-5 text-on-surface-variant">
            The mock top-up was canceled before confirmation. Your wallet balance
            was not changed, and no real payment was processed.
          </p>
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
