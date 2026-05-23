import { OrderClient } from "@/components/order/OrderClient";
import { requireUserSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const session = await requireUserSession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      address: true,
      walletBalance: true,
      role: true,
      isActive: true
    }
  });

  if (!user?.isActive || user.role !== "USER") {
    redirect("/login?message=Please sign in to continue.");
  }

  return (
    <section className="px-5 py-14 md:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="font-mono text-[11px] font-bold uppercase text-primary">
            Protected checkout
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase md:text-6xl">
            Your bag
          </h1>
          <p className="mt-5 text-lg leading-8 text-on-surface-variant">
            Review quantities, choose dine-in, takeaway, or delivery, then place the
            order. Prices are validated again on the server.
          </p>
        </div>
        <OrderClient
          user={{
            name: user.name,
            address: user.address,
            walletBalance: Number(user.walletBalance)
          }}
        />
      </div>
    </section>
  );
}
