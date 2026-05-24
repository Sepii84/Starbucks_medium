import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { apiUser } from "@/lib/api";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { walletTopUpSchema } from "@/lib/validations";
import { createWalletTopUp, WalletTopUpError } from "@/lib/wallet/top-up";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { user, response } = await apiUser();
  if (response) return response;

  if (user.role !== Role.USER) {
    return NextResponse.json({ error: "User account required." }, { status: 403 });
  }

  const rate = checkRateLimit(`wallet-top-up-api:${user.id}`, { limit: 10, windowMs: 60_000 });
  if (!rate.ok) {
    return NextResponse.json({ error: rateLimitMessage(rate.retryAfter) }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as { amount?: unknown };
  const parsed = walletTopUpSchema.safeParse({ amount: String(body.amount ?? "") });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Check the top-up amount.",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    const topUp = await createWalletTopUp(user.id, parsed.data.amount);
    return NextResponse.json({
      topUpId: topUp.topUp.id,
      status: topUp.topUp.status,
      provider: topUp.topUp.provider,
      confirmationUrl: topUp.confirmationUrl
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof WalletTopUpError
            ? error.message
            : "Could not start the demo wallet top-up."
      },
      { status: 400 }
    );
  }
}
