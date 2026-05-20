"use server";

import { Prisma, RedemptionStatus, RewardTransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type ActionState } from "@/lib/utils";
import { pointAdjustmentSchema, redeemRewardSchema, rewardRuleSchema } from "@/lib/validations";

class UserFacingError extends Error {}

function rewardFormData(formData: FormData) {
  return {
    id: String(formData.get("id") ?? ""),
    menuItemId: String(formData.get("menuItemId") ?? ""),
    pointsRequired: String(formData.get("pointsRequired") ?? ""),
    isActive: formData.get("isActive") === "on"
  };
}

function dbErrorMessage(error: unknown, fallback: string) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "That menu item already has a reward rule.";
  }

  return fallback;
}

export async function redeemRewardAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = redeemRewardSchema.safeParse({
    rewardRuleId: String(formData.get("rewardRuleId") ?? "")
  });

  if (!parsed.success) {
    return { message: "Choose a reward to redeem.", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const [currentUser, rule] = await Promise.all([
        tx.user.findUnique({
          where: { id: user.id },
          select: { rewardPoints: true, name: true }
        }),
        tx.rewardRule.findUnique({
          where: { id: parsed.data.rewardRuleId },
          include: { menuItem: true }
        })
      ]);

      if (!currentUser) {
        throw new UserFacingError("User account was not found.");
      }

      if (!rule?.isActive || !rule.menuItem.isAvailable) {
        throw new UserFacingError("This reward is not available right now.");
      }

      if (currentUser.rewardPoints < rule.pointsRequired) {
        throw new UserFacingError(
          `You need ${rule.pointsRequired - currentUser.rewardPoints} more points for this reward.`
        );
      }

      await tx.user.update({
        where: { id: user.id },
        data: { rewardPoints: { decrement: rule.pointsRequired } }
      });

      const redemption = await tx.rewardRedemption.create({
        data: {
          userId: user.id,
          rewardRuleId: rule.id,
          menuItemId: rule.menuItemId,
          pointsSpent: rule.pointsRequired,
          status: RedemptionStatus.COMPLETED
        }
      });

      await tx.rewardTransaction.create({
        data: {
          userId: user.id,
          type: RewardTransactionType.SPENT,
          points: -rule.pointsRequired,
          redemptionId: redemption.id,
          description: `Redeemed ${rule.pointsRequired} points for ${rule.menuItem.name}.`
        }
      });

      await tx.notification.create({
        data: {
          type: "REWARD_REDEEMED",
          message: `${currentUser.name} redeemed ${rule.pointsRequired} points for ${rule.menuItem.name}.`
        }
      });
    });
  } catch (error) {
    return {
      message: error instanceof UserFacingError ? error.message : "Could not redeem reward."
    };
  }

  revalidatePath("/rewards");
  revalidatePath("/account");
  revalidatePath("/admin/rewards");
  revalidatePath("/admin/notifications");
  return { ok: true, message: "Reward redeemed. Show the confirmation at pickup." };
}

export async function createRewardRuleAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = rewardRuleSchema.safeParse(rewardFormData(formData));

  if (!parsed.success) {
    return { message: "Check the reward rule.", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.rewardRule.create({
      data: {
        menuItemId: parsed.data.menuItemId,
        pointsRequired: parsed.data.pointsRequired,
        isActive: parsed.data.isActive
      }
    });
  } catch (error) {
    return { message: dbErrorMessage(error, "Could not create reward rule.") };
  }

  revalidatePath("/rewards");
  revalidatePath("/admin/rewards");
  return { ok: true, message: "Reward rule created." };
}

export async function updateRewardRuleAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = rewardRuleSchema.safeParse(rewardFormData(formData));

  if (!parsed.success || !parsed.data.id) {
    return {
      message: "Check the reward rule.",
      errors: parsed.success ? {} : parsed.error.flatten().fieldErrors
    };
  }

  try {
    await prisma.rewardRule.update({
      where: { id: parsed.data.id },
      data: {
        menuItemId: parsed.data.menuItemId,
        pointsRequired: parsed.data.pointsRequired,
        isActive: parsed.data.isActive
      }
    });
  } catch (error) {
    return { message: dbErrorMessage(error, "Could not update reward rule.") };
  }

  revalidatePath("/rewards");
  revalidatePath("/admin/rewards");
  return { ok: true, message: "Reward rule updated." };
}

export async function deleteRewardRuleAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const redemptionCount = await prisma.rewardRedemption.count({
    where: { rewardRuleId: id }
  });

  if (redemptionCount > 0) {
    revalidatePath("/admin/rewards");
    return;
  }

  await prisma.rewardRule.delete({ where: { id } });
  revalidatePath("/rewards");
  revalidatePath("/admin/rewards");
}

export async function adjustUserPointsAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = pointAdjustmentSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    points: String(formData.get("points") ?? ""),
    reason: String(formData.get("reason") ?? "")
  });

  if (!parsed.success) {
    return { message: "Check the point adjustment.", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: parsed.data.userId },
        select: { id: true, name: true, rewardPoints: true }
      });

      if (!target) {
        throw new UserFacingError("User was not found.");
      }

      const nextPoints = target.rewardPoints + parsed.data.points;

      if (nextPoints < 0) {
        throw new UserFacingError("This adjustment would make reward points negative.");
      }

      await tx.user.update({
        where: { id: target.id },
        data: { rewardPoints: nextPoints }
      });

      await tx.rewardTransaction.create({
        data: {
          userId: target.id,
          type: RewardTransactionType.ADJUSTED,
          points: parsed.data.points,
          description: `${parsed.data.reason} (admin: ${admin.email})`
        }
      });

      await tx.notification.create({
        data: {
          type: "REWARD_ADJUSTED",
          message: `Admin adjusted ${target.name}'s points by ${parsed.data.points}.`
        }
      });
    });
  } catch (error) {
    return {
      message:
        error instanceof UserFacingError ? error.message : "Could not adjust reward points."
    };
  }

  revalidatePath("/admin/rewards");
  revalidatePath("/admin/notifications");
  revalidatePath("/rewards");
  return { ok: true, message: "Reward points adjusted." };
}
