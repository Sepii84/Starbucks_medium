"use server";

import { revalidatePath } from "next/cache";
import { requireUser, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type ActionState } from "@/lib/utils";
import { profileSchema } from "@/lib/validations";

export async function updateProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? "")
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields."
    };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null
    }
  });

  await setSessionCookie(updated);
  revalidatePath("/account");

  return { ok: true, message: "Your account details were updated." };
}
