import { redirect } from "next/navigation";
import { CreditCard, Gift, Mail, WalletCards } from "lucide-react";
import { GiftCardPurchaseForm } from "@/components/gift-cards/GiftCardPurchaseForm";
import { FallbackImage } from "@/components/ui/FallbackImage";
import { GlassCard } from "@/components/ui/GlassCard";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GiftCardsPage() {
  const [user, templates] = await Promise.all([
    getCurrentUser(),
    prisma.giftCardTemplate.findMany({
      where: { isActive: true },
      orderBy: { amount: "asc" }
    })
  ]);

  if (user?.role === "ADMIN") {
    redirect("/admin");
  }

  const isUser = user?.role === "USER";
  const simpleTemplates = templates.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    amount: Number(template.amount),
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
      value: "User email",
      icon: Mail
    }
  ];

  return (
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
                    className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
                  >
                    <FallbackImage
                      src={template.imageUrl ?? ""}
                      alt={template.name}
                      className="h-36 w-full object-cover"
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
              amount directly into the recipient's wallet balance.
            </p>
            <div className="mt-6">
              <GiftCardPurchaseForm templates={simpleTemplates} loggedIn={isUser} />
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
