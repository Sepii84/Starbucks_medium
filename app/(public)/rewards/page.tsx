import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Award, BadgeCheck, Gift, Sparkles } from "lucide-react";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { RewardRedeemForm } from "@/components/rewards/RewardRedeemForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { FallbackImage } from "@/components/ui/FallbackImage";
import { GlassCard } from "@/components/ui/GlassCard";
import { getCurrentUser, getSessionUser } from "@/lib/auth";
import { getActiveRewardRules } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "Rewards | Starbucks Medium",
    description:
      "Earn points on orders and redeem rewards for selected drinks and menu favorites.",
    path: "/rewards"
  })
};

export default async function RewardsPage() {
  const session = await getSessionUser();

  if (session?.role === "ADMIN") {
    redirect("/admin");
  }

  const [user, rewardRules] = await Promise.all([
    session?.role === "USER" ? getCurrentUser() : Promise.resolve(null),
    getActiveRewardRules()
  ]);
  const isUser = user?.role === "USER";
  const points = isUser ? user.rewardPoints : 0;
  const nextReward =
    rewardRules.find((rule) => rule.pointsRequired > points) ?? rewardRules[0] ?? null;
  const pointsNeeded = nextReward ? Math.max(0, nextReward.pointsRequired - points) : 0;
  const progress = nextReward
    ? Math.min(100, Math.round((points / nextReward.pointsRequired) * 100))
    : 0;

  const cards = [
    {
      label: "Current points",
      value: isUser ? points.toString() : "Sign in",
      icon: Award
    },
    {
      label: "Next reward",
      value: nextReward?.menuItem.name ?? "Coming soon",
      icon: Sparkles
    },
    {
      label: "Points needed",
      value: isUser && nextReward ? pointsNeeded.toString() : "-",
      icon: BadgeCheck
    },
    {
      label: "Available rewards",
      value: rewardRules.length.toString(),
      icon: Gift
    }
  ];

  return (
    <PublicPageFrame>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Rewards", path: "/rewards" }
        ])}
      />
      <section className="px-5 py-14 md:px-16">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-bold uppercase text-primary">
            Starbucks rewards
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase md:text-6xl">
            Points with every pour
          </h1>
          <p className="mt-5 text-lg leading-8 text-on-surface-variant">
            Earn 1 point for every dollar on paid orders, then redeem points for
            eligible drinks and menu items. All balances are validated on the server.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

        {nextReward && (
          <GlassCard className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase text-primary">
                  Progress
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold">
                  {isUser
                    ? `Toward ${nextReward.menuItem.name}`
                    : "Sign in to track reward progress"}
                </h2>
              </div>
              <p className="text-sm text-on-surface-variant">
                {isUser
                  ? pointsNeeded === 0
                    ? "Ready to redeem."
                    : `${pointsNeeded} points to go.`
                  : "Browse rewards now, redeem after login."}
              </p>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                style={{ width: `${isUser ? progress : 0}%` }}
              />
            </div>
          </GlassCard>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rewardRules.length ? (
            rewardRules.map((rule) => {
              const eligible = isUser && points >= rule.pointsRequired;
              const missingPoints = Math.max(0, rule.pointsRequired - points);

              return (
                <GlassCard
                  key={rule.id}
                  className="group flex flex-col overflow-hidden transition duration-300 ease-out hover:-translate-y-1 hover:border-primary/35 hover:shadow-glow active:scale-[0.99] motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <FallbackImage
                    src={rule.menuItem.imageUrl}
                    alt={rule.menuItem.name}
                    className="h-52 w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-mono text-[10px] font-bold uppercase text-primary">
                      {rule.menuItem.category.name}
                    </p>
                    <h2 className="mt-2 font-display text-xl font-semibold uppercase">
                      {rule.menuItem.name}
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-6 text-on-surface-variant">
                      {rule.menuItem.description}
                    </p>
                    <div className="my-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <p className="text-on-surface-variant">Price</p>
                        <p className="mt-1 text-primary">
                          {formatCurrency(rule.menuItem.price)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <p className="text-on-surface-variant">Points</p>
                        <p className="mt-1 text-primary">{rule.pointsRequired}</p>
                      </div>
                    </div>
                    <p className="mb-4 text-xs text-on-surface-variant">
                      {isUser
                        ? eligible
                          ? `You have ${points} points.`
                          : `You have ${points} points. ${missingPoints} more needed.`
                        : "Public visitors can browse rewards before signing in."}
                    </p>
                    <RewardRedeemForm
                      rewardRuleId={rule.id}
                      eligible={eligible}
                      loggedIn={isUser}
                      missingPoints={missingPoints}
                    />
                  </div>
                </GlassCard>
              );
            })
          ) : (
            <GlassCard className="p-8 text-on-surface-variant md:col-span-2 xl:col-span-3">
              No rewards are available right now.
            </GlassCard>
          )}
        </div>
      </div>
      </section>
    </PublicPageFrame>
  );
}
