import { OrderStatus, OrderType, Role } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  next: z.string().optional()
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password needs one uppercase letter.")
    .regex(/[0-9]/, "Password needs one number."),
  phone: z.string().optional(),
  address: z.string().optional()
});

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().max(40).optional(),
  address: z.string().max(240).optional()
});

export const adminAccountSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Enter a valid email address."),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional()
  })
  .refine(
    (value) =>
      !value.newPassword ||
      (Boolean(value.currentPassword) &&
        value.newPassword.length >= 8 &&
        /[A-Z]/.test(value.newPassword) &&
        /[0-9]/.test(value.newPassword)),
    {
      message:
        "To change password, enter your current password and a new password with 8 characters, one uppercase letter, and one number.",
      path: ["newPassword"]
    }
  );

export const menuItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name is required."),
  slug: z.string().optional(),
  description: z.string().min(8, "Description is required."),
  price: z.coerce.number().positive("Price must be greater than zero."),
  imageUrl: z.string().url("Use a valid image URL."),
  categoryId: z.string().min(1, "Choose a category."),
  isAvailable: z.coerce.boolean().default(false)
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Category name is required."),
  slug: z.string().optional(),
  description: z.string().optional()
});

export const orderItemInputSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(20)
});

export const createOrderSchema = z
  .object({
    customerName: z.string().min(2, "Customer name is required."),
    orderType: z.nativeEnum(OrderType),
    tableNumber: z.string().optional(),
    deliveryAddress: z.string().optional(),
    items: z.array(orderItemInputSchema).min(1, "Your bag is empty.")
  })
  .superRefine((value, ctx) => {
    if (value.orderType === "DINE_IN" && !value.tableNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tableNumber"],
        message: "Table number is required for dine-in orders."
      });
    }

    if (
      (value.orderType === "TAKEAWAY" || value.orderType === "DELIVERY") &&
      !value.deliveryAddress?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryAddress"],
        message: "Address is required for takeaway or delivery orders."
      });
    }
  });

export const orderStatusSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(OrderStatus)
});

export const siteInfoSchema = z.object({
  aboutText: z.string().min(20, "About text should be descriptive."),
  footerDescription: z.string().min(10, "Footer description is required."),
  address: z.string().min(5, "Address is required."),
  phone: z.string().min(5, "Phone number is required."),
  email: z.string().email("Enter a valid email address."),
  openingHours: z.string().min(5, "Opening hours are required."),
  instagramUrl: z.string().url("Use a valid Instagram URL.").optional().or(z.literal("")),
  twitterUrl: z.string().url("Use a valid X/Twitter URL.").optional().or(z.literal("")),
  mapUrl: z.string().url("Use a valid map URL.").optional().or(z.literal(""))
});

export const adminUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.nativeEnum(Role),
  isActive: z.coerce.boolean().default(false)
});

export function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
