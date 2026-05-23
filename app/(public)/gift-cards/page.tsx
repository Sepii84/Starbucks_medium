import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCard, Gift, Mail, WalletCards } from "lucide-react";
import { GiftCardPurchaseForm } from "@/components/gift-cards/GiftCardPurchaseForm";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { LinkButton } from "@/components/ui/Button";
import { FallbackImage } from "@/components/ui/FallbackImage";
import { GlassCard } from "@/components/ui/GlassCard";
import { getCurrentUser, getSessionUser } from "@/lib/auth";
import { getActiveGiftCardTemplates } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gift Cards | Starbucks Medium",
  description:
    "Buy in-person pickup gift cards or send demo wallet credit to another registered Starbucks Medium user."
};

export default async function GiftCardsPage() {
  const session = await getSessionUser();

  if (session?.role === "ADMIN") {
    redirect("/admin");
  }

  const [user, templates] = await Promise.all([
    session?.role === "USER" ? getCurrentUser() : Promise.resolve(null),
    getActiveGiftCardTemplates()
  ]);
  const isUser = user?.role === "USER";
  const simpleTemplates = templates.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    amount: template.amount,
    imageUrl: template.imageUrl
  }));

  const cards = [
    {
      label: "Wallet balance",
      value: isUser ? formatCurrency(Number(user.walletBalance)) : "Sign in",
      icon: WalletCards
    },
    {
      label: "Active options",
      value: templates.length.toString(),
      icon: Gift
    },
    {
      label: "Pickup method",
      value: "In person",
      icon: CreditCard
    },
    {
      label: "Website delivery",
      value: "Registered users",
      icon: Mail
    }
  ];

  return (
    <PublicPageFrame>
      <section className="px-5 py-14 md:px-16">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-bold uppercase text-primary">
            Starbucks gift cards
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase md:text-6xl">
            Send a little glow
          </h1>
          <p className="mt-5 text-lg leading-8 text-on-surface-variant">
            Buy a gift card for in-person collection or send one to another registered
            user inside the website. Gift cards use fake in-website wallet balance,
            never real payment processing.
          </p>
          {!isUser && (
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton href="/login?message=Please sign in to buy or send gift cards.&next=/gift-cards">
                Log in to send or buy a gift card
              </LinkButton>
              <LinkButton href="/register" variant="secondary">
                Create an account to use wallet and gift cards
              </LinkButton>
            </div>
          )}
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

        <div className="grid gap-8 xl:grid-cols-[1fr_0.9fr]">
          <GlassCard className="p-6">
            <h2 className="font-display text-2xl font-semibold">Choose a card</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {simpleTemplates.length ? (
                simpleTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition duration-300 ease-out hover:-translate-y-1 hover:border-primary/35 hover:shadow-glow active:scale-[0.99] motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    <FallbackImage
                      src={template.imageUrl ?? ""}
                      alt={template.name}
                      className="h-36 w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
                    />
                    <div className="p-4">
                      <p className="font-display text-xl font-semibold text-primary">
                        {formatCurrency(template.amount)}
                      </p>
                      <h3 className="mt-2 font-semibold">{template.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                        {template.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-on-surface-variant">No gift card options are active yet.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="h-fit p-6">
            <h2 className="font-display text-2xl font-semibold">Buy or send</h2>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              In-person cards create a pickup code. Website-email cards move the
              amount directly into the recipient's wallet balance. Recipient must
              have a registered account on this site.
            </p>
            <div className="mt-6">
              <GiftCardPurchaseForm templates={simpleTemplates} loggedIn={isUser} />
            </div>
          </GlassCard>
        </div>
      </div>
      </section>
    </PublicPageFrame>
  );
}
