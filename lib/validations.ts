import {
  GiftCardDeliveryType,
  OrderStatus,
  OrderType,
  PaymentMethod,
  Role
} from "@prisma/client";
import { z } from "zod";
import { isAllowedSocialLink } from "@/lib/site-config";

const unsafeTextPattern = /<\s*\/?\s*script|javascript:|data:text\/html|on[a-z]+\s*=/i;
const unsafeUrlSchemes = new Set(["javascript:", "file:", "data:"]);

function safeText(value: string) {
  return !unsafeTextPattern.test(value);
}

function textField(min: number, max: number, requiredMessage: string) {
  return z
    .string()
    .trim()
    .min(min, requiredMessage)
    .max(max, "Text is too long.")
    .refine(safeText, "Remove scripts or unsafe markup.");
}

function optionalTextField(max: number) {
  return z
    .string()
    .trim()
    .max(max, "Text is too long.")
    .refine(safeText, "Remove scripts or unsafe markup.")
    .optional();
}

function isSafeImageUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed || trimmed.length > 500 || trimmed.includes("\0")) {
    return false;
  }

  if (trimmed === "/pending-admin-upload") {
    return true;
  }

  if (trimmed.startsWith("/")) {
    return (
      trimmed.startsWith("/images/") &&
      !trimmed.includes("..") &&
      !trimmed.includes("//") &&
      /\.(jpe?g|png|webp|svg)$/i.test(trimmed)
    );
  }

  if (!URL.canParse(trimmed)) {
    return false;
  }

  const url = new URL(trimmed);
  if (unsafeUrlSchemes.has(url.protocol)) {
    return false;
  }

  return url.protocol === "https:" && safeText(trimmed);
}

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Password is required.").max(200),
  next: z
    .string()
    .trim()
    .max(300)
    .refine((value) => !value || (value.startsWith("/") && !value.startsWith("//")), {
      message: "Use a relative redirect path."
    })
    .optional()
});

export const registerSchema = z.object({
  name: textField(2, 80, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long.")
    .regex(/[A-Z]/, "Password needs one uppercase letter.")
    .regex(/[0-9]/, "Password needs one number."),
  phone: optionalTextField(40),
  address: optionalTextField(240)
});

export const profileSchema = z.object({
  name: textField(2, 80, "Name must be at least 2 characters."),
  phone: optionalTextField(40),
  address: optionalTextField(240)
});

export const adminAccountSchema = z
  .object({
    name: textField(2, 80, "Name must be at least 2 characters."),
    email: z.string().trim().email("Enter a valid email address.").max(254),
    currentPassword: z.string().max(200).optional(),
    newPassword: z.string().max(128).optional()
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
  name: textField(2, 120, "Name is required."),
  slug: z
    .string()
    .trim()
    .max(140, "Slug is too long.")
    .regex(/^[a-z0-9-]*$/i, "Slug can only use letters, numbers, and hyphens.")
    .optional(),
  description: textField(8, 800, "Description is required."),
  price: z.coerce
    .number()
    .positive("Price must be greater than zero.")
    .max(1000, "Price is too high."),
  imageUrl: z
    .string()
    .trim()
    .min(1, "Image URL or path is required.")
    .refine(isSafeImageUrl, "Use a safe HTTPS image URL or local /images path."),
  categoryId: z.string().min(1, "Choose a category."),
  isAvailable: z.coerce.boolean().default(false),
  isFeatured: z.coerce.boolean().default(false)
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: textField(2, 100, "Category name is required."),
  slug: z
    .string()
    .trim()
    .max(120, "Slug is too long.")
    .regex(/^[a-z0-9-]*$/i, "Slug can only use letters, numbers, and hyphens.")
    .optional(),
  description: optionalTextField(300)
});

export const orderItemInputSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(20)
});

export const createOrderSchema = z
  .object({
    customerName: textField(2, 80, "Customer name is required."),
    orderType: z.nativeEnum(OrderType),
    tableNumber: optionalTextField(30),
    deliveryAddress: optionalTextField(240),
    paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.PAY_AT_COUNTER),
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

export const redeemRewardSchema = z.object({
  rewardRuleId: z.string().min(1, "Choose a reward.")
});

export const rewardRuleSchema = z.object({
  id: z.string().optional(),
  menuItemId: z.string().min(1, "Choose a menu item."),
  pointsRequired: z.coerce
    .number()
    .int("Points must be a whole number.")
    .min(1, "Points must be greater than zero.")
    .max(100000, "Points are too high."),
  isActive: z.coerce.boolean().default(false)
});

export const pointAdjustmentSchema = z.object({
  userId: z.string().min(1, "Choose a user."),
  points: z.coerce
    .number()
    .int("Points must be a whole number.")
    .min(-100000, "Adjustment is too low.")
    .max(100000, "Adjustment is too high.")
    .refine((value) => value !== 0, "Adjustment cannot be zero."),
  reason: textField(5, 240, "Reason is required.")
});

export const walletTopUpSchema = z.object({
  amount: z.coerce
    .number()
    .min(1, "Minimum top-up is $1.")
    .max(500, "Maximum top-up is $500.")
});

export const walletAdjustmentSchema = z.object({
  userId: z.string().min(1, "Choose a user."),
  amount: z.coerce
    .number()
    .min(-5000, "Adjustment is too low.")
    .max(5000, "Adjustment is too high.")
    .refine((value) => value !== 0, "Adjustment cannot be zero."),
  reason: textField(5, 240, "Reason is required.")
});

export const giftCardTemplateSchema = z.object({
  id: z.string().optional(),
  name: textField(2, 100, "Template name is required."),
  description: textField(8, 500, "Description is required."),
  amount: z.coerce
    .number()
    .min(1, "Amount must be at least $1.")
    .max(500, "Amount cannot exceed $500."),
  imageUrl: z
    .string()
    .trim()
    .refine((value) => !value || isSafeImageUrl(value), "Use a safe HTTPS image URL or local /images path.")
    .optional(),
  isActive: z.coerce.boolean().default(false)
});

export const giftCardPurchaseSchema = z
  .object({
    templateId: z.string().min(1, "Choose a gift card."),
    deliveryType: z.nativeEnum(GiftCardDeliveryType),
    recipientEmail: z
      .string()
      .trim()
      .email("Enter a valid recipient email.")
      .max(254)
      .optional()
      .or(z.literal("")),
    message: optionalTextField(240)
  })
  .superRefine((value, ctx) => {
    if (value.deliveryType === GiftCardDeliveryType.WEBSITE_EMAIL) {
      const email = value.recipientEmail?.trim();

      if (!email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipientEmail"],
          message: "Recipient email is required."
        });
      } else if (!z.string().email().safeParse(email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipientEmail"],
          message: "Enter a valid recipient email."
        });
      }
    }
  });

export const siteInfoSchema = z.object({
  aboutText: textField(20, 1200, "About text should be descriptive."),
  footerDescription: textField(10, 600, "Footer description is required."),
  address: textField(5, 240, "Address is required."),
  phone: textField(5, 40, "Phone number is required."),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  openingHours: textField(5, 120, "Opening hours are required."),
  instagramUrl: z
    .string()
    .refine(isAllowedSocialLink, "Use a valid Instagram URL or #.")
    .optional(),
  twitterUrl: z
    .string()
    .refine(isAllowedSocialLink, "Use a valid X/Twitter URL or #.")
    .optional(),
  mapUrl: z
    .string()
    .trim()
    .refine((value) => !value || (URL.canParse(value) && new URL(value).protocol === "https:"), "Use a valid HTTPS map URL.")
    .optional()
    .or(z.literal(""))
});

export const adminUserSchema = z.object({
  id: z.string().min(1),
  name: textField(2, 80, "Name is required."),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  phone: optionalTextField(40),
  address: optionalTextField(240),
  role: z.nativeEnum(Role),
  isActive: z.coerce.boolean().default(false)
});

export function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
