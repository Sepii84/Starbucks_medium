"use server";

import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin, setSessionCookie, verifyPassword, hashPassword } from "@/lib/auth";
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
  const parsed = menuItemSchema.safeParse(menuFormData(formData));

  if (!parsed.success) {
    return { message: "Check the menu item fields.", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.menuItem.create({
      data: {
        name: parsed.data.name,
        slug: slugify(parsed.data.slug || parsed.data.name),
        description: parsed.data.description,
        price: parsed.data.price,
        imageUrl: parsed.data.imageUrl,
        categoryId: parsed.data.categoryId,
        isAvailable: parsed.data.isAvailable,
        isFeatured: parsed.data.isFeatured
      }
    });
  } catch (error) {
    return { message: dbErrorMessage(error, "Could not create menu item.") };
  }

  revalidatePath("/menu");
  revalidatePath("/admin/menu");
  return { ok: true, message: "Menu item created." };
}

export async function updateMenuItemAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = menuItemSchema.safeParse(menuFormData(formData));

  if (!parsed.success || !parsed.data.id) {
    return { message: "Check the menu item fields.", errors: parsed.success ? {} : parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.menuItem.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        slug: slugify(parsed.data.slug || parsed.data.name),
        description: parsed.data.description,
        price: parsed.data.price,
        imageUrl: parsed.data.imageUrl,
        categoryId: parsed.data.categoryId,
        isAvailable: parsed.data.isAvailable,
        isFeatured: parsed.data.isFeatured
      }
    });
  } catch (error) {
    return { message: dbErrorMessage(error, "Could not update menu item.") };
  }

  revalidatePath("/menu");
  revalidatePath("/admin/menu");
  return { ok: true, message: "Menu item updated." };
}

export async function deleteMenuItemAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (id) {
    await prisma.menuItem.delete({ where: { id } });
  }

  revalidatePath("/menu");
  revalidatePath("/admin/menu");
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

  await prisma.order.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
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
