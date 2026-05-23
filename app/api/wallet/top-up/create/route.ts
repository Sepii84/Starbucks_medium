import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { apiUser } from "@/lib/api";
import { walletTopUpSchema } from "@/lib/validations";
import { createWalletTopUp } from "@/lib/wallet/top-up";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { user, response } = await apiUser();
  if (response) return response;

  if (user.role !== Role.USER) {
    return NextResponse.json({ error: "User account required." }, { status: 403 });
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
          error instanceof Error
            ? error.message
            : "Could not start the demo wallet top-up."
      },
      { status: 400 }
    );
  }
}
