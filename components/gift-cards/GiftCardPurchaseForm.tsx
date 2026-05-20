"use client";

import { Gift, Send } from "lucide-react";
import { useActionState, useState } from "react";
import { buyGiftCardAction, type GiftCardActionState } from "@/app/actions/gift-cards";
import { Button, LinkButton } from "@/components/ui/Button";
import { FieldError, FormMessage, inputClasses, labelClasses } from "@/components/ui/Form";
import { cn, formatCurrency } from "@/lib/utils";

type DeliveryType = "IN_PERSON" | "WEBSITE_EMAIL";

type Template = {
  id: string;
  name: string;
  description: string;
  amount: number;
};

const initialState: GiftCardActionState = {};

export function GiftCardPurchaseForm({
  templates,
  loggedIn
}: {
  templates: Template[];
  loggedIn: boolean;
}) {
  const [state, action, pending] = useActionState(buyGiftCardAction, initialState);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("IN_PERSON");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");

  if (!loggedIn) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <OptionCard
            active
            icon={Gift}
            title="Collect in person"
            description="Buy now, pick up the gift card code in store."
          />
          <OptionCard
            active={false}
            icon={Send}
            title="Send to user"
            description="Deliver website credit to a registered user email."
          />
        </div>
        <LinkButton href="/login?message=Please sign in to buy gift cards." className="w-full">
          Login to buy gift cards
        </LinkButton>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state.message} ok={state.ok} />
      {state.code && (
        <div className="rounded-xl border border-primary/25 bg-primary/10 p-4 text-center">
          <p className="font-mono text-[10px] font-bold uppercase text-primary">
            Gift card code
          </p>
          <p className="mt-2 font-display text-2xl font-semibold text-primary">{state.code}</p>
        </div>
      )}

      <div>
        <label className={labelClasses}>Gift card option</label>
        <select
          className={inputClasses}
          name="templateId"
          value={templateId}
          onChange={(event) => setTemplateId(event.target.value)}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} - {formatCurrency(template.amount)}
            </option>
          ))}
        </select>
        <FieldError messages={state.errors?.templateId} />
      </div>

      <input type="hidden" name="deliveryType" value={deliveryType} />
      <div>
        <label className={labelClasses}>Delivery type</label>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setDeliveryType("IN_PERSON")}
            className="text-left"
          >
            <OptionCard
              active={deliveryType === "IN_PERSON"}
              icon={Gift}
              title="Collect in person"
              description="Create a gift card code for pickup."
            />
          </button>
          <button
            type="button"
            onClick={() => setDeliveryType("WEBSITE_EMAIL")}
            className="text-left"
          >
            <OptionCard
              active={deliveryType === "WEBSITE_EMAIL"}
              icon={Send}
              title="Send to user"
              description="Send balance to a registered user email."
            />
          </button>
        </div>
      </div>

      {deliveryType === "WEBSITE_EMAIL" && (
        <div>
          <label className={labelClasses}>Recipient email</label>
          <input
            className={inputClasses}
            name="recipientEmail"
            placeholder="registered-user@example.com"
            type="email"
          />
          <FieldError messages={state.errors?.recipientEmail} />
        </div>
      )}

      <div>
        <label className={labelClasses}>Optional message</label>
        <textarea className={inputClasses} name="message" rows={3} maxLength={240} />
        <FieldError messages={state.errors?.message} />
      </div>

      <Button className="w-full" disabled={pending || !templates.length} type="submit">
        {pending ? "Processing..." : "Buy Gift Card"}
      </Button>
    </form>
  );
}

function OptionCard({
  active,
  icon: Icon,
  title,
  description
}: {
  active: boolean;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        "h-full rounded-xl border p-4 transition",
        active
          ? "border-primary/40 bg-primary/10 text-on-surface"
          : "border-white/10 bg-white/[0.03] text-on-surface-variant"
      )}
    >
      <Icon className="text-primary" size={20} />
      <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6">{description}</p>
    </div>
  );
}
