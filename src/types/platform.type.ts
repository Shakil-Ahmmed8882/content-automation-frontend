export type PlatformStatus = "LIVE" | "COMING_SOON";

export interface Platform {
  id: string;
  key: string;
  name: string;
  logoUrl: string | null;
  logoPublicId: string | null;
  status: PlatformStatus;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
