"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

type AddItemInput = Omit<CartItem, "quantity">;

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: AddItemInput) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "starbucks-medium-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CartItem[];
        setItems(
          parsed.filter(
            (item) =>
              typeof item.menuItemId === "string" &&
              typeof item.name === "string" &&
              typeof item.price === "number" &&
              typeof item.quantity === "number"
          )
        );
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [hydrated, items]);

  const addItem = useCallback((item: AddItemInput) => {
    setItems((current) => {
      const existing = current.find((cartItem) => cartItem.menuItemId === item.menuItemId);

      if (existing) {
        return current.map((cartItem) =>
          cartItem.menuItemId === item.menuItemId
            ? { ...cartItem, quantity: Math.min(cartItem.quantity + 1, 20) }
            : cartItem
        );
      }

      return [...current, { ...item, quantity: 1 }];
    });
  }, []);

  const increase = useCallback((id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.menuItemId === id ? { ...item, quantity: Math.min(item.quantity + 1, 20) } : item
      )
    );
  }, []);

  const decrease = useCallback((id: string) => {
    setItems((current) =>
      current
        .map((item) =>
          item.menuItemId === id ? { ...item, quantity: Math.max(item.quantity - 1, 0) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.menuItemId !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.quantity * item.price, 0),
      addItem,
      increase,
      decrease,
      remove,
      clear
    }),
    [addItem, clear, decrease, increase, items, remove]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);

  if (!value) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return value;
}
