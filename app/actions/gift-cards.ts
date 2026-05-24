"use server";

import crypto from "crypto";
import {
  GiftCardDeliveryType,
  GiftCardStatus,
  GiftCardTransactionType,
  Prisma,
  Role,
  WalletTransactionType
} from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  deleteManagedStoragePath,
  deleteUploadedImageIfUnused,
  getOptionalImageFile,
  StorageImageError,
  uploadAdminImageFile,
  type UploadedImage
} from "@/lib/admin/storage-images";
import { requireAdmin, requireUser } from "@/lib/auth";
import { GIFT_CARDS_TAG } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { formatCurrency, normalizeEmail, type ActionState } from "@/lib/utils";
import { giftCardPurchaseSchema, giftCardTemplateSchema } from "@/lib/validations";

class UserFacingError extends Error {}

export type GiftCardActionState = ActionState & {
  code?: string;
};

function money(value: number) {
  return Number(value.toFixed(2));
}

async function generateGiftCardCode() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = `SM-${crypto.randomBytes(3).toString("hex").toUpperCase()}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;
    const existing = await prisma.giftCard.findUnique({ where: { code } });

    if (!existing) {
      return code;
    }
  }

  throw new Error("Could not generate a unique gift card code.");
}

function templateFormData(formData: FormData) {
  return {
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    isActive: formData.get("isActive") === "on"
  };
}

function dbErrorMessage(error: unknown, fallback: string) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "A gift card template with that name already exists.";
  }

  return fallback;
}

function storageErrorMessage(error: unknown, fallback: string) {
  if (error instanceof StorageImageError) {
    return error.message;
  }

  return dbErrorMessage(error, fallback);
}

export async function buyGiftCardAction(
  _: GiftCardActionState,
  formData: FormData
): Promise<GiftCardActionState> {
  const user = await requireUser();
  const parsed = giftCardPurchaseSchema.safeParse({
    templateId: String(formData.get("templateId") ?? ""),
    deliveryType: String(formData.get("deliveryType") ?? ""),
    recipientEmail: normalizeEmail(String(formData.get("recipientEmail") ?? "")),
    message: String(formData.get("message") ?? "")
  });

  if (!parsed.success) {
    return { message: "Check the gift card details.", errors: parsed.error.flatten().fieldErrors };
  }

  const rate = checkRateLimit(`gift-card-buy:${user.id}`, { limit: 10, windowMs: 60_000 });
  if (!rate.ok) {
    return { message: rateLimitMessage(rate.retryAfter) };
  }

  const code = await generateGiftCardCode();

  try {
    await prisma.$transaction(async (tx) => {
      const [buyer, template] = await Promise.all([
        tx.user.findUnique({
          where: { id: user.id },
          select: { id: true, name: true, email: true, walletBalance: true }
        }),
        tx.giftCardTemplate.findUnique({ where: { id: parsed.data.templateId } })
      ]);

      if (!buyer) {
        throw new UserFacingError("User account was not found.");
      }

      if (!template?.isActive) {
        throw new UserFacingError("This gift card option is not available right now.");
      }

      const amount = money(Number(template.amount));
      const senderBalanceAfter = money(Number(buyer.walletBalance) - amount);

      if (senderBalanceAfter < 0) {
        throw new UserFacingError("Your wallet balance is too low for this gift card.");
      }

      let recipient:
        | {
            id: string;
            name: string;
            email: string;
            walletBalance: Prisma.Decimal;
          }
        | null = null;

      if (parsed.data.deliveryType === GiftCardDeliveryType.WEBSITE_EMAIL) {
        recipient = await tx.user.findFirst({
          where: {
            email: normalizeEmail(parsed.data.recipientEmail ?? ""),
            role: Role.USER,
            isActive: true
          },
          select: { id: true, name: true, email: true, walletBalance: true }
        });

        if (!recipient) {
          throw new UserFacingError("No registered user found with this email.");
        }

        if (recipient.id === buyer.id) {
          throw new UserFacingError("Send website-email gift cards to another registered user.");
        }
      }

      const giftCard = await tx.giftCard.create({
        data: {
          code,
          buyerId: buyer.id,
          recipientUserId: recipient?.id ?? null,
          recipientEmail: recipient?.email ?? null,
          amount,
          balance:
            parsed.data.deliveryType === GiftCardDeliveryType.IN_PERSON ? amount : 0,
          deliveryType: parsed.data.deliveryType,
          status:
            parsed.data.deliveryType === GiftCardDeliveryType.IN_PERSON
              ? GiftCardStatus.ACTIVE
              : GiftCardStatus.USED,
          message: parsed.data.message?.trim() || null
        }
      });

      await tx.user.update({
        where: { id: buyer.id },
        data: { walletBalance: senderBalanceAfter }
      });

      await tx.walletTransaction.create({
        data: {
          userId: buyer.id,
          type: WalletTransactionType.GIFT_CARD_PURCHASE,
          amount: -amount,
          balanceAfter: senderBalanceAfter,
          giftCardId: giftCard.id,
          description:
            parsed.data.deliveryType === GiftCardDeliveryType.IN_PERSON
              ? `Purchased ${template.name} for in-person pickup.`
              : `Sent ${template.name} to ${recipient?.email}.`
        }
      });

      await tx.giftCardTransaction.create({
        data: {
          giftCardId: giftCard.id,
          userId: buyer.id,
          type: GiftCardTransactionType.CREATED,
          amount,
          description:
            parsed.data.deliveryType === GiftCardDeliveryType.IN_PERSON
              ? "Gift card created for in-person collection."
              : "Gift card created for website-email delivery."
        }
      });

      if (recipient) {
        const recipientBalanceAfter = money(Number(recipient.walletBalance) + amount);

        await tx.user.update({
          where: { id: recipient.id },
          data: { walletBalance: recipientBalanceAfter }
        });

        await tx.walletTransaction.create({
          data: {
            userId: recipient.id,
            type: WalletTransactionType.GIFT_CARD_RECEIVED,
            amount,
            balanceAfter: recipientBalanceAfter,
            giftCardId: giftCard.id,
            description: `Received ${template.name} from ${buyer.email}.`
          }
        });

        await tx.giftCardTransaction.createMany({
          data: [
            {
              giftCardId: giftCard.id,
              userId: buyer.id,
              type: GiftCardTransactionType.SENT,
              amount,
              description: `Gift card sent to ${recipient.email}.`
            },
            {
              giftCardId: giftCard.id,
              userId: recipient.id,
              type: GiftCardTransactionType.RECEIVED,
              amount,
              description: `Gift card received from ${buyer.email}.`
            }
          ]
        });
      }

      await tx.notification.create({
        data: {
          type:
            parsed.data.deliveryType === GiftCardDeliveryType.IN_PERSON
              ? "GIFT_CARD_IN_PERSON"
              : "GIFT_CARD_SENT",
          message:
            parsed.data.deliveryType === GiftCardDeliveryType.IN_PERSON
              ? `${buyer.name} bought a ${formatCurrency(amount)} gift card for in-person collection.`
              : `${buyer.name} sent a ${formatCurrency(amount)} gift card to ${recipient?.email}.`
        }
      });
    });
  } catch (error) {
    return {
      message:
        error instanceof UserFacingError ? error.message : "Could not process gift card."
    };
  }

  revalidatePath("/gift-cards");
  revalidatePath("/wallet");
  revalidatePath("/account");
  revalidatePath("/admin/gift-cards");
  revalidatePath("/admin/wallet");
  revalidatePath("/admin/notifications");

  return {
    ok: true,
    code,
    message:
      parsed.data.deliveryType === GiftCardDeliveryType.IN_PERSON
        ? "Your gift card has been created. You can collect it in person using this code."
        : "Gift card sent and recipient wallet updated."
  };
}

export async function createGiftCardTemplateAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const imageFile = getOptionalImageFile(formData);
  const parsed = giftCardTemplateSchema.safeParse(templateFormData(formData));

  if (!parsed.success) {
    return { message: "Check the gift card template.", errors: parsed.error.flatten().fieldErrors };
  }

  let uploadedImage: UploadedImage | null = null;

  try {
    if (imageFile) {
      uploadedImage = await uploadAdminImageFile(
        imageFile,
        "gift-cards",
        parsed.data.name || `gift-card-${parsed.data.amount}`
      );
    }

    await prisma.giftCardTemplate.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        amount: money(parsed.data.amount),
        imageUrl: uploadedImage?.url ?? (parsed.data.imageUrl || null),
        isActive: parsed.data.isActive
      }
    });
  } catch (error) {
    if (uploadedImage) {
      await deleteManagedStoragePath(uploadedImage.path).catch(() => undefined);
    }

    return {
      message: storageErrorMessage(error, "Could not create gift card template.")
    };
  }

  revalidatePath("/gift-cards");
  revalidatePath("/admin/gift-cards");
  revalidateTag(GIFT_CARDS_TAG);
  return {
    ok: true,
    message: uploadedImage
      ? "Image uploaded and gift card template created."
      : "Gift card template created."
  };
}

export async function updateGiftCardTemplateAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const imageFile = getOptionalImageFile(formData);
  const parsed = giftCardTemplateSchema.safeParse(templateFormData(formData));

  if (!parsed.success || !parsed.data.id) {
    return {
      message: "Check the gift card template.",
      errors: parsed.success ? {} : parsed.error.flatten().fieldErrors
    };
  }

  let uploadedImage: UploadedImage | null = null;
  let finalImageUrl = parsed.data.imageUrl || null;
  const existing = await prisma.giftCardTemplate.findUnique({
    where: { id: parsed.data.id },
    select: { imageUrl: true }
  });

  if (!existing) {
    return { message: "Gift card template was not found." };
  }

  try {
    if (imageFile) {
      uploadedImage = await uploadAdminImageFile(
        imageFile,
        "gift-cards",
        parsed.data.name || `gift-card-${parsed.data.amount}`
      );
      finalImageUrl = uploadedImage.url;
    }

    await prisma.giftCardTemplate.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        amount: money(parsed.data.amount),
        imageUrl: finalImageUrl,
        isActive: parsed.data.isActive
      }
    });
  } catch (error) {
    if (uploadedImage) {
      await deleteManagedStoragePath(uploadedImage.path).catch(() => undefined);
    }

    return {
      message: storageErrorMessage(error, "Could not update gift card template.")
    };
  }

  if (existing.imageUrl && existing.imageUrl !== finalImageUrl) {
    await deleteUploadedImageIfUnused(existing.imageUrl).catch(() => undefined);
  }

  revalidatePath("/gift-cards");
  revalidatePath("/admin/gift-cards");
  revalidateTag(GIFT_CARDS_TAG);
  return {
    ok: true,
    message: uploadedImage
      ? "Image uploaded and gift card template saved."
      : "Gift card template updated."
  };
}

export async function cancelGiftCardAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const giftCard = await tx.giftCard.findUnique({
      where: { id },
      include: {
        buyer: {
          select: { id: true, walletBalance: true }
        }
      }
    });

    if (!giftCard || giftCard.status === GiftCardStatus.CANCELLED) {
      return;
    }

    const refundable = giftCard.status === GiftCardStatus.ACTIVE ? Number(giftCard.balance) : 0;

    await tx.giftCard.update({
      where: { id },
      data: { status: GiftCardStatus.CANCELLED, balance: 0 }
    });

    await tx.giftCardTransaction.create({
      data: {
        giftCardId: id,
        userId: giftCard.buyerId,
        type: GiftCardTransactionType.CANCELLED,
        amount: refundable,
        description: "Gift card cancelled by admin."
      }
    });

    if (refundable > 0) {
      const balanceAfter = money(Number(giftCard.buyer.walletBalance) + refundable);

      await tx.user.update({
        where: { id: giftCard.buyerId },
        data: { walletBalance: balanceAfter }
      });

      await tx.walletTransaction.create({
        data: {
          userId: giftCard.buyerId,
          type: WalletTransactionType.REFUND,
          amount: refundable,
          balanceAfter,
          giftCardId: id,
          description: "Refund for cancelled gift card."
        }
      });
    }
  });

  revalidatePath("/admin/gift-cards");
  revalidatePath("/admin/wallet");
  revalidatePath("/gift-cards");
  revalidatePath("/wallet");
}
