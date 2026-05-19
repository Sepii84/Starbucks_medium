"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/order/CartProvider";

export function AddToBagButton({
  item
}: {
  item: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
  };
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      className="w-full"
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          addItem({
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl
          });
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1300);
        });
      }}
    >
      {added ? <Check size={16} /> : <ShoppingBag size={16} />}
      {added ? "Added" : "Add to Bag"}
    </Button>
  );
}
