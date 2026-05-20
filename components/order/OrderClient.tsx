"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { createOrderAction, type CreateOrderResult } from "@/app/actions/order";
import { useCart } from "@/components/order/CartProvider";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FallbackImage } from "@/components/ui/FallbackImage";
import { GlassCard } from "@/components/ui/GlassCard";
import { inputClasses, labelClasses } from "@/components/ui/Form";
import { cn, formatCurrency } from "@/lib/utils";

type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";
type PaymentMethod = "PAY_AT_COUNTER" | "WALLET";

export function OrderClient({
  user
}: {
  user: {
    name: string;
    address?: string | null;
    walletBalance: number;
  };
}) {
  const { items, count, subtotal, increase, decrease, remove, clear } = useCart();
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAY_AT_COUNTER");
  const [customerName, setCustomerName] = useState(user.name);
  const [tableNumber, setTableNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState(user.address ?? "");
  const [result, setResult] = useState<CreateOrderResult | null>(null);
  const [pending, startTransition] = useTransition();

  const summaryLabel = useMemo(() => {
    if (orderType === "DINE_IN") {
      return tableNumber ? `Table ${tableNumber}` : "Table required";
    }

    return deliveryAddress || "Address required";
  }, [deliveryAddress, orderType, tableNumber]);

  function submitOrder() {
    setResult(null);
    startTransition(async () => {
      const response = await createOrderAction({
        customerName,
        orderType,
        paymentMethod,
        tableNumber,
        deliveryAddress,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity
        }))
      });

      setResult(response);

      if (response.ok) {
        clear();
      }
    });
  }

  if (!items.length && !result?.ok) {
    return (
      <EmptyState
        title="Your bag is empty"
        description="Browse the menu and add a drink before finalizing an order."
      />
    );
  }

  if (result?.ok) {
    return (
      <GlassCard className="mx-auto max-w-2xl p-8 text-center">
        <p className="font-mono text-[11px] font-bold uppercase text-primary">
          Confirmation
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold uppercase">
          Order received
        </h1>
        <p className="mt-4 text-on-surface-variant">{result.message}</p>
        <p className="mt-2 font-mono text-xs uppercase text-primary">Order ID: {result.orderId}</p>
        <div className="mt-8 flex justify-center gap-3">
          <LinkButton href="/menu">Order More</LinkButton>
          <LinkButton href="/account" variant="ghost">
            View Account
          </LinkButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        {items.map((item) => (
          <GlassCard key={item.menuItemId} className="flex gap-4 p-4">
            <FallbackImage
              src={item.imageUrl}
              alt={item.name}
              className="h-24 w-24 rounded-lg object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
              <div>
                <h2 className="truncate font-display text-lg font-semibold uppercase">
                  {item.name}
                </h2>
                <p className="text-sm text-primary">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-full border border-white/10 bg-black/20">
                  <button
                    type="button"
                    className="focus-ring rounded-full p-2 text-on-surface-variant hover:text-primary"
                    onClick={() => decrease(item.menuItemId)}
                    aria-label={`Decrease ${item.name}`}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-8 text-center font-mono text-xs font-bold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="focus-ring rounded-full p-2 text-on-surface-variant hover:text-primary"
                    onClick={() => increase(item.menuItemId)}
                    aria-label={`Increase ${item.name}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.menuItemId)}
                  className="focus-ring inline-flex items-center gap-2 rounded-full border border-red-400/25 px-3 py-2 text-xs text-red-100 hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="h-fit p-6">
        <div className="mb-6">
          <p className="font-mono text-[11px] font-bold uppercase text-primary">
            Finalize order
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Order summary</h2>
        </div>

        {result && !result.ok && (
          <div className="mb-5 rounded-lg border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {result.message}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className={labelClasses} htmlFor="customerName">
              Customer name
            </label>
            <input
              className={inputClasses}
              id="customerName"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
            />
            {result && !result.ok && result.errors?.customerName && (
              <p className="mt-2 text-sm text-red-200">{result.errors.customerName[0]}</p>
            )}
          </div>

          <div>
            <label className={labelClasses}>Order type</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["DINE_IN", "TAKEAWAY", "DELIVERY"] as OrderType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  className={cn(
                    "focus-ring rounded-full border px-3 py-3 font-mono text-[10px] font-bold uppercase transition",
                    orderType === type
                      ? "border-primary bg-primary text-on-primary"
                      : "border-white/10 bg-white/[0.03] text-on-surface-variant hover:text-primary"
                  )}
                >
                  {type.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClasses}>Payment method</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["PAY_AT_COUNTER", "WALLET"] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={cn(
                    "focus-ring rounded-full border px-3 py-3 font-mono text-[10px] font-bold uppercase transition",
                    paymentMethod === method
                      ? "border-primary bg-primary text-on-primary"
                      : "border-white/10 bg-white/[0.03] text-on-surface-variant hover:text-primary"
                  )}
                >
                  {method === "PAY_AT_COUNTER" ? "Pay at counter" : "Wallet"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-on-surface-variant">
              Wallet balance: <span className="text-primary">{formatCurrency(user.walletBalance)}</span>
            </p>
          </div>

          {orderType === "DINE_IN" ? (
            <div>
              <label className={labelClasses} htmlFor="tableNumber">
                Table number
              </label>
              <input
                className={inputClasses}
                id="tableNumber"
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
              />
              {result && !result.ok && result.errors?.tableNumber && (
                <p className="mt-2 text-sm text-red-200">{result.errors.tableNumber[0]}</p>
              )}
            </div>
          ) : (
            <div>
              <label className={labelClasses} htmlFor="deliveryAddress">
                Address
              </label>
              <textarea
                className={inputClasses}
                id="deliveryAddress"
                rows={4}
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
              />
              {result && !result.ok && result.errors?.deliveryAddress && (
                <p className="mt-2 text-sm text-red-200">
                  {result.errors.deliveryAddress[0]}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="my-6 border-t border-white/10 pt-6">
          <div className="space-y-3 text-sm">
            {items.map((item) => (
              <div key={item.menuItemId} className="flex justify-between gap-3">
                <span className="text-on-surface-variant">
                  {item.quantity}x {item.name}
                </span>
                <span>{formatCurrency(item.quantity * item.price)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t border-white/10 pt-5 font-display text-xl font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(subtotal)}</span>
          </div>
          <div className="mt-3 rounded-lg bg-primary/10 p-3 text-sm text-on-surface-variant">
            <span className="text-primary">{count} items</span> - {orderType.replace("_", " ")} -{" "}
            {summaryLabel}
          </div>
          <div className="mt-3 rounded-lg bg-secondary/10 p-3 text-sm text-on-surface-variant">
            Payment:{" "}
            <span className="text-secondary">
              {paymentMethod === "WALLET" ? "Wallet" : "Pay at counter"}
            </span>
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">
            Final total is recalculated on the server using current menu prices.
          </p>
        </div>

        <Button className="w-full" disabled={pending || !items.length} onClick={submitOrder}>
          {pending ? "Submitting..." : "Place Order"}
        </Button>
        <Link
          href="/menu"
          className="mt-4 block text-center text-sm text-on-surface-variant hover:text-primary"
        >
          Keep browsing menu
        </Link>
      </GlassCard>
    </div>
  );
}
