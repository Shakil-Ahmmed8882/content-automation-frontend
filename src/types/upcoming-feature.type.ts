export type UpcomingFeatureStatus = "COMING_SOON" | "IN_DEVELOPMENT" | "PLANNED";

export interface UpcomingFeature {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  status: UpcomingFeatureStatus;
  sortOrder: number;
  isPremiumVisible: boolean;
  createdAt: string;
  updatedAt: string;
}
