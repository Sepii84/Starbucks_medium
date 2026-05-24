"use client";

import { useRef, useState } from "react";
import { GiftCardPurchaseForm } from "@/components/gift-cards/GiftCardPurchaseForm";
import { FallbackImage } from "@/components/ui/FallbackImage";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn, formatCurrency } from "@/lib/utils";

type Template = {
  id: string;
  name: string;
  description: string;
  amount: number;
  imageUrl?: string | null;
};

export function GiftCardsClient({
  templates,
  loggedIn
}: {
  templates: Template[];
  loggedIn: boolean;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? "");
  const [highlightPurchase, setHighlightPurchase] = useState(false);
  const purchaseRef = useRef<HTMLDivElement>(null);

  function selectTemplate(template: Template) {
    setSelectedTemplateId(template.id);
    setHighlightPurchase(true);

    window.requestAnimationFrame(() => {
      const target = purchaseRef.current;
      if (!target) {
        return;
      }

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start"
      });
      target.focus({ preventScroll: true });
      window.setTimeout(() => setHighlightPurchase(false), 1500);
    });
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_0.9fr]">
      <GlassCard className="p-6">
        <h2 className="font-display text-2xl font-semibold">Choose a card</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {templates.length ? (
            templates.map((template) => {
              const selected = selectedTemplateId === template.id;

              return (
                <button
                  key={template.id}
                  type="button"
                  aria-label={`Buy ${template.name}`}
                  aria-pressed={selected}
                  onClick={() => selectTemplate(template)}
                  className={cn(
                    "group overflow-hidden rounded-xl border bg-white/[0.03] text-left transition duration-300 ease-out hover:-translate-y-1 hover:border-primary/35 hover:shadow-glow active:scale-[0.99] motion-reduce:transform-none motion-reduce:transition-none",
                    selected ? "border-primary/55 shadow-glow" : "border-white/10"
                  )}
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
                    {selected && (
                      <p className="mt-3 font-mono text-[10px] font-bold uppercase text-primary">
                        Selected
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <p className="text-on-surface-variant">No gift card options are active yet.</p>
          )}
        </div>
      </GlassCard>

      <div
        ref={purchaseRef}
        tabIndex={-1}
        className={cn(
          "scroll-mt-28 rounded-xl transition duration-300",
          highlightPurchase && "ring-2 ring-primary/55 shadow-glow"
        )}
      >
        <GlassCard className="h-fit p-6">
          <h2 className="font-display text-2xl font-semibold">Buy or send</h2>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            In-person cards create a pickup code. Website-email cards move the
            amount directly into the recipient&apos;s wallet balance. Recipient must
            have a registered account on this site.
          </p>
          <div className="mt-6">
            <GiftCardPurchaseForm
              templates={templates}
              loggedIn={loggedIn}
              selectedTemplateId={selectedTemplateId}
              onTemplateChange={setSelectedTemplateId}
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
