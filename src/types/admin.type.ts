import type { ApiEnvelope } from "@/types/api.type";
import type { User } from "@/types/auth.type";
import type { PlatformStatus } from "@/types/platform.type";

export type { Platform, PlatformStatus } from "@/types/platform.type";

export type AdminRole = User["role"];
export type AdminUserStatus = User["status"];
export type PageMeta = NonNullable<ApiEnvelope<unknown>["meta"]>;

export interface Paged<T> {
  data: T[];
  meta: PageMeta;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isPremium: boolean;
  premiumSince: string | null;
  status: AdminUserStatus;
  emailVerified: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface ListAdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  actorId?: string;
  action?: string;
  entityType?: string;
}

export type FeatureStatus = "COMING_SOON" | "IN_DEVELOPMENT" | "PLANNED";

export interface AdminFeature {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  status: FeatureStatus;
  sortOrder: number;
  isPremiumVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformBody {
  key: string;
  name: string;
  status: PlatformStatus;
  sortOrder: number;
  isActive: boolean;
}

export interface UpdatePlatformBody {
  name?: string;
  status?: PlatformStatus;
  sortOrder?: number;
  isActive?: boolean;
}

export interface FeatureBody {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  status: FeatureStatus;
  sortOrder: number;
  isPremiumVisible: boolean;
}

export const AUDIT_ACTIONS = [
  "PLATFORM_CREATED",
  "PLATFORM_UPDATED",
  "FEATURE_CREATED",
  "FEATURE_UPDATED",
  "FEATURE_DELETED",
  "USER_BLOCKED",
  "USER_UNBLOCKED",
  "USER_ROLE_CHANGED",
  "USER_PREMIUM_GRANTED",
  "USER_PREMIUM_REVOKED",
  "PAYMENT_VERIFIED",
  "CONNECTION_DISCONNECTED",
] as const;

export const AUDIT_ENTITY_TYPES = [
  "User",
  "Payment",
  "Platform",
  "UpcomingFeature",
  "SocialConnection",
] as const;
