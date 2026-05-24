import { CreditCard, Gift, History, Mail } from "lucide-react";
import {
  CancelGiftCardButton,
  CreateGiftCardTemplateForm,
  EditGiftCardTemplateForm
} from "@/components/admin/AdminGiftCardForms";
import { GlassCard } from "@/components/ui/GlassCard";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminGiftCardsPage() {
  const [templates, giftCards, transactions] = await Promise.all([
    prisma.giftCardTemplate.findMany({ orderBy: { amount: "asc" } }),
    prisma.giftCard.findMany({
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        recipientUser: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 40
    }),
    prisma.giftCardTransaction.findMany({
      include: {
        giftCard: true,
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 30
    })
  ]);

  const cards = [
    { label: "Templates", value: templates.length, icon: Gift },
    { label: "Active templates", value: templates.filter((item) => item.isActive).length, icon: CreditCard },
    { label: "Purchased cards", value: giftCards.length, icon: Mail },
    { label: "History rows", value: transactions.length, icon: History }
  ];

  const simpleTemplates = templates.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    amount: Number(template.amount),
    imageUrl: template.imageUrl,
    isActive: template.isActive
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase text-primary">Gift cards</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold uppercase">
          Gift card desk
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
            <h2 className="mb-5 font-display text-2xl font-semibold">Create template</h2>
            <CreateGiftCardTemplateForm />
          </GlassCard>
          <GlassCard className="p-5">
            <h2 className="mb-5 font-display text-2xl font-semibold">Templates</h2>
            <div className="space-y-4">
              {simpleTemplates.length ? (
                simpleTemplates.map((template) => (
                  <EditGiftCardTemplateForm key={template.id} template={template} />
                ))
              ) : (
                <p className="text-on-surface-variant">No gift card templates yet.</p>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-8">
          <GlassCard className="p-5">
            <h2 className="mb-5 font-display text-2xl font-semibold">Purchased gift cards</h2>
            <div className="space-y-4">
              {giftCards.length ? (
                giftCards.map((giftCard) => (
                  <div
                    key={giftCard.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-mono text-[10px] font-bold uppercase text-primary">
                          {giftCard.status} - {giftCard.deliveryType.replaceAll("_", " ")}
                        </p>
                        <h3 className="mt-2 font-display text-xl font-semibold">
                          {giftCard.code}
                        </h3>
                        <p className="mt-2 text-sm text-on-surface-variant">
                          Buyer: {giftCard.buyer.name} ({giftCard.buyer.email})
                        </p>
                        <p className="mt-1 text-sm text-on-surface-variant">
                          Recipient:{" "}
                          {giftCard.recipientUser
                            ? `${giftCard.recipientUser.name} (${giftCard.recipientUser.email})`
                            : giftCard.recipientEmail ?? "In-person pickup"}
                        </p>
                      </div>
                      <div className="text-sm md:text-right">
                        <p className="text-primary">
                          {formatCurrency(Number(giftCard.amount))}
                        </p>
                        <p className="text-on-surface-variant">
                          Balance {formatCurrency(Number(giftCard.balance))}
                        </p>
                        <p className="mt-2 text-on-surface-variant">
                          {formatDate(giftCard.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <CancelGiftCardButton
                        id={giftCard.id}
                        disabled={giftCard.status === "CANCELLED"}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-on-surface-variant">No purchased gift cards yet.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="mb-5 font-display text-2xl font-semibold">Gift card history</h2>
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
                          {transaction.type} - {transaction.user.email}
                        </p>
                        <p className="text-on-surface-variant">{transaction.description}</p>
                      </div>
                      <p className="text-primary">{formatCurrency(Number(transaction.amount))}</p>
                    </div>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      {transaction.giftCard.code} - {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-on-surface-variant">No gift card history yet.</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
