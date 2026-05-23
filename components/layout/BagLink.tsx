"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/order/CartProvider";

export function BagLink({
  className,
  compact = false,
  iconOnly = false
}: {
  className?: string;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const { count } = useCart();
  const label = count === 1 ? "Open bag with 1 item" : `Open bag with ${count} items`;

  return (
    <Link
      href="/order"
      className={cn(
        "focus-ring relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-primary/25 bg-primary/10 font-mono text-[11px] font-bold uppercase text-primary transition hover:bg-primary/15 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
        iconOnly ? "h-11 w-11 p-0" : "px-4 py-2",
        className
      )}
      aria-label={label}
    >
      <ShoppingBag size={compact ? 18 : 16} />
      {!iconOnly && <span className={compact ? "text-[10px]" : ""}>Bag</span>}
      <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] leading-none text-on-primary shadow-glow">
        <span className="sr-only">{label}</span>
        {count}
      </span>
    </Link>
  );
}
