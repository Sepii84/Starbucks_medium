import type { Role } from "@prisma/client";
import type { SessionPayload } from "@/lib/auth";

export type ClientUser = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  phone: string | null;
  address: string | null;
  rewardPoints: number;
  walletBalance: number;
  isActive: boolean;
};

type SerializableUserInput = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  phone?: string | null;
  address?: string | null;
  rewardPoints?: number | null;
  walletBalance?: { toString(): string } | number | string | null;
  isActive?: boolean | null;
};

export function serializeUserForClient(user: SerializableUserInput): ClientUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? null,
    address: user.address ?? null,
    rewardPoints: user.rewardPoints ?? 0,
    walletBalance: Number(user.walletBalance ?? 0),
    isActive: user.isActive ?? true
  };
}

export function serializeUsersForClient(users: SerializableUserInput[]) {
  return users.map((user) => serializeUserForClient(user));
}

export function serializeSessionUserForClient(user: SessionPayload): ClientUser {
  return {
    id: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: null,
    address: null,
    rewardPoints: 0,
    walletBalance: 0,
    isActive: true
  };
}
