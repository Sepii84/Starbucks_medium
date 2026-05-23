"use server";

import {
  OrderStatus,
  Prisma,
  RewardTransactionType,
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
import { requireAdmin, setSessionCookie, verifyPassword, hashPassword } from "@/lib/auth";
import { PUBLIC_MENU_TAG, SITE_INFO_TAG } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, slugify, type ActionState } from "@/lib/utils";
import {
  adminAccountSchema,
  adminUserSchema,
  categorySchema,
  menuItemSchema,
  orderStatusSchema,
  siteInfoSchema
} from "@/lib/validations";

function dbErrorMessage(error: unknown, fallback: string) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "That value is already in use. Try a different name, slug, or email.";
  }

  return fallback;
}

function storageErrorMessage(error: unknown, fallback: string) {
  if (error instanceof StorageImageError) {
    return error.message;
  }

  return dbErrorMessage(error, fallback);
}

function menuFormData(formData: FormData) {
  return {
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    isAvailable: formData.get("isAvailable") === "on",
    isFeatured: formData.get("isFeatured") === "on"
  };
}

export async function createMenuItemAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const imageFile = getOptionalImageFile(formData);
  const rawData = menuFormData(formData);
  const parsed = menuItemSchema.safeParse({
    ...rawData,
    imageUrl: rawData.imageUrl || (imageFile ? "/pending-admin-upload" : "")
  });

  if (!parsed.success) {
    return { message: "Check the menu item fields.", errors: parsed.error.flatten().fieldErrors };
  }

  let uploadedImage: UploadedImage | null = null;

  try {
    if (imageFile) {
      uploadedImage = await uploadAdminImageFile(
        imageFile,
        "menu-items",
        parsed.data.slug || parsed.data.name
      );
    }

    await prisma.menuItem.create({
      data: {
        name: parsed.data.name,
        slug: slugify(parsed.data.slug || parsed.data.name),
        description: parsed.data.description,
        price: parsed.data.price,
        imageUrl: uploadedImage?.url ?? parsed.data.imageUrl,
        categoryId: parsed.data.categoryId,
        isAvailable: parsed.data.isAvailable,
        isFeatured: parsed.data.isFeatured
      }
    });
  } catch (error) {
    if (uploadedImage) {
      await deleteManagedStoragePath(uploadedImage.path).catch(() => undefined);
    }

    return { message: storageErrorMessage(error, "Could not create menu item.") };
  }

  revalidatePath("/menu");
  revalidatePath("/admin/menu");
  revalidateTag(PUBLIC_MENU_TAG);
  return {
    ok: true,
    message: uploadedImage ? "Image uploaded and menu item created." : "Menu item created."
  };
}

export async function updateMenuItemAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const imageFile = getOptionalImageFile(formData);
  const rawData = menuFormData(formData);
  const parsed = menuItemSchema.safeParse({
    ...rawData,
    imageUrl: rawData.imageUrl || (imageFile ? "/pending-admin-upload" : "")
  });

  if (!parsed.success || !parsed.data.id) {
    return { message: "Check the menu item fields.", errors: parsed.success ? {} : parsed.error.flatten().fieldErrors };
  }

  let uploadedImage: UploadedImage | null = null;
  let finalImageUrl = parsed.data.imageUrl;
  const existing = await prisma.menuItem.findUnique({
    where: { id: parsed.data.id },
    select: { imageUrl: true }
  });

  if (!existing) {
    return { message: "Menu item was not found." };
  }

  try {
    if (imageFile) {
      uploadedImage = await uploadAdminImageFile(
        imageFile,
        "menu-items",
        parsed.data.slug || parsed.data.name
      );
      finalImageUrl = uploadedImage.url;
    }

    await prisma.menuItem.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        slug: slugify(parsed.data.slug || parsed.data.name),
        description: parsed.data.description,
        price: parsed.data.price,
        imageUrl: finalImageUrl,
        categoryId: parsed.data.categoryId,
        isAvailable: parsed.data.isAvailable,
        isFeatured: parsed.data.isFeatured
      }
    });
  } catch (error) {
    if (uploadedImage) {
      await deleteManagedStoragePath(uploadedImage.path).catch(() => undefined);
    }

    return { message: storageErrorMessage(error, "Could not update menu item.") };
  }

  if (existing.imageUrl !== finalImageUrl) {
    await deleteUploadedImageIfUnused(existing.imageUrl).catch(() => undefined);
  }

  revalidatePath("/menu");
  revalidatePath("/admin/menu");
  revalidateTag(PUBLIC_MENU_TAG);
  return {
    ok: true,
    message: uploadedImage ? "Image uploaded and menu item saved." : "Menu item updated."
  };
}

export async function deleteMenuItemAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (id) {
    const existing = await prisma.menuItem.findUnique({
      where: { id },
      select: { imageUrl: true }
    });

    await prisma.menuItem.delete({ where: { id } });

    if (existing?.imageUrl) {
      await deleteUploadedImageIfUnused(existing.imageUrl).catch(() => undefined);
    }
  }

  revalidatePath("/menu");
  revalidatePath("/admin/menu");
  revalidateTag(PUBLIC_MENU_TAG);
}

export async function createCategoryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? "")
  });

  if (!parsed.success) {
    return { message: "Check the category fields.", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.menuCategory.create({
      data: {
        name: parsed.data.name,
        slug: slugify(parsed.data.slug || parsed.data.name),
        description: parsed.data.description || null
      }
    });
  } catch (error) {
    return { message: dbErrorMessage(error, "Could not create category.") };
  }

  revalidatePath("/menu");
  revalidatePath("/admin/menu");
  revalidateTag(PUBLIC_MENU_TAG);
  return { ok: true, message: "Category created." };
}

export async function updateCategoryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? "")
  });

  if (!parsed.success || !parsed.data.id) {
    return { message: "Check the category fields.", errors: parsed.success ? {} : parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.menuCategory.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        slug: slugify(parsed.data.slug || parsed.data.name),
        description: parsed.data.description || null
      }
    });
  } catch (error) {
    return { message: dbErrorMessage(error, "Could not update category.") };
  }

  revalidatePath("/menu");
  revalidatePath("/admin/menu");
  revalidateTag(PUBLIC_MENU_TAG);
  return { ok: true, message: "Category updated." };
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (id) {
    await prisma.menuCategory.delete({ where: { id } });
  }

  revalidatePath("/menu");
  revalidatePath("/admin/menu");
  revalidateTag(PUBLIC_MENU_TAG);
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = orderStatusSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? "")
  });

  if (!parsed.success) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id: parsed.data.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            rewardPoints: true,
            walletBalance: true
          }
        },
        rewardTransactions: {
          where: { type: RewardTransactionType.EARNED }
        },
        walletTransactions: {
          where: { type: WalletTransactionType.ORDER_PAYMENT }
        }
      }
    });

    if (!existing) {
      return;
    }

    await tx.order.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status }
    });

    if (parsed.data.status !== OrderStatus.CANCELLED || existing.status === OrderStatus.CANCELLED) {
      return;
    }

    const earnedPoints = existing.rewardTransactions.reduce(
      (sum, transaction) => sum + Math.max(0, transaction.points),
      0
    );
    const pointsToReverse = Math.min(existing.user.rewardPoints, earnedPoints);
    const walletRefund = Number(
      existing.walletTransactions
        .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0)
        .toFixed(2)
    );
    const balanceAfter = Number((Number(existing.user.walletBalance) + walletRefund).toFixed(2));

    if (pointsToReverse > 0 || walletRefund > 0) {
      await tx.user.update({
        where: { id: existing.userId },
        data: {
          rewardPoints:
            pointsToReverse > 0 ? { decrement: pointsToReverse } : undefined,
          walletBalance: walletRefund > 0 ? balanceAfter : undefined
        }
      });
    }

    if (pointsToReverse > 0) {
      await tx.rewardTransaction.create({
        data: {
          userId: existing.userId,
          type: RewardTransactionType.REFUNDED,
          points: -pointsToReverse,
          orderId: existing.id,
          description: `Reversed ${pointsToReverse} points after order cancellation.`
        }
      });
    }

    if (walletRefund > 0) {
      await tx.walletTransaction.create({
        data: {
          userId: existing.userId,
          type: WalletTransactionType.REFUND,
          amount: walletRefund,
          balanceAfter,
          orderId: existing.id,
          description: "Wallet refund after order cancellation."
        }
      });
    }

    await tx.notification.create({
      data: {
        type: "ORDER_CANCELLED",
        message: `${existing.user.name}'s order was cancelled. Wallet and reward reversals were recorded.`,
        orderId: existing.id
      }
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/notifications");
  revalidatePath("/wallet");
  revalidatePath("/rewards");
}

export async function updateSiteInfoAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = siteInfoSchema.safeParse({
    aboutText: String(formData.get("aboutText") ?? ""),
    footerDescription: String(formData.get("footerDescription") ?? ""),
    address: String(formData.get("address") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: normalizeEmail(String(formData.get("email") ?? "")),
    openingHours: String(formData.get("openingHours") ?? ""),
    instagramUrl: String(formData.get("instagramUrl") ?? ""),
    twitterUrl: String(formData.get("twitterUrl") ?? ""),
    mapUrl: String(formData.get("mapUrl") ?? "")
  });

  if (!parsed.success) {
    return { message: "Check the site information.", errors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.siteInfo.findFirst();
  const data = {
    ...parsed.data,
    instagramUrl: parsed.data.instagramUrl || null,
    twitterUrl: parsed.data.twitterUrl || null,
    mapUrl: parsed.data.mapUrl || null
  };

  if (existing) {
    await prisma.siteInfo.update({ where: { id: existing.id }, data });
  } else {
    await prisma.siteInfo.create({ data });
  }

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/location");
  revalidatePath("/admin/site-info");
  revalidateTag(SITE_INFO_TAG);
  return { ok: true, message: "Website information updated." };
}

export async function updateUserAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = adminUserSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    email: normalizeEmail(String(formData.get("email") ?? "")),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    role: String(formData.get("role") ?? ""),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    return { message: "Check the user fields.", errors: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.id === admin.id && parsed.data.role !== Role.ADMIN) {
    return { message: "You cannot remove your own admin role." };
  }

  try {
    await prisma.user.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        role: parsed.data.role,
        isActive: parsed.data.id === admin.id ? true : parsed.data.isActive
      }
    });
  } catch (error) {
    return { message: dbErrorMessage(error, "Could not update user.") };
  }

  revalidatePath("/admin/users");
  return { ok: true, message: "User updated." };
}

export async function deactivateUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id || id === admin.id) {
    return;
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false }
  });

  revalidatePath("/admin/users");
}

export async function markNotificationReadAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (id) {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}

export async function markAllNotificationsReadAction() {
  await requireAdmin();
  await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}

export async function updateAdminAccountAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = adminAccountSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: normalizeEmail(String(formData.get("email") ?? "")),
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? "")
  });

  if (!parsed.success) {
    return { message: "Check the account fields.", errors: parsed.error.flatten().fieldErrors };
  }

  const current = await prisma.user.findUnique({ where: { id: admin.id } });

  if (!current) {
    return { message: "Admin account was not found." };
  }

  const data: {
    name: string;
    email: string;
    passwordHash?: string;
  } = {
    name: parsed.data.name,
    email: parsed.data.email
  };

  if (parsed.data.newPassword) {
    const passwordOk = await verifyPassword(
      parsed.data.currentPassword ?? "",
      current.passwordHash
    );

    if (!passwordOk) {
      return { message: "Current password is incorrect." };
    }

    data.passwordHash = await hashPassword(parsed.data.newPassword);
  }

  try {
    const updated = await prisma.user.update({
      where: { id: admin.id },
      data
    });

    await setSessionCookie(updated);
  } catch (error) {
    return { message: dbErrorMessage(error, "Could not update account.") };
  }

  revalidatePath("/admin/account");
  return { ok: true, message: "Admin account updated." };
}
