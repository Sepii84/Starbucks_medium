import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCard, Gift, Mail, WalletCards } from "lucide-react";
import { GiftCardsClient } from "@/components/gift-cards/GiftCardsClient";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { JsonLd } from "@/components/seo/JsonLd";
import { LinkButton } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { getCurrentUser, getSessionUser } from "@/lib/auth";
import { getActiveGiftCardTemplates } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "Gift Cards | Starbucks Medium",
    description:
      "Buy and send Starbucks Medium gift cards for coffee lovers, friends, and family.",
    path: "/gift-cards"
  })
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
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Gift Cards", path: "/gift-cards" }
        ])}
      />
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

        <GiftCardsClient templates={simpleTemplates} loggedIn={isUser} />
      </div>
      </section>
    </PublicPageFrame>
  );
}
