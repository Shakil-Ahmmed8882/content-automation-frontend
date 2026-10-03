export interface Connection {
  id: string;
  platform: { key: string; name: string };
  platformAccountName: string | null;
  status: "CONNECTED" | "EXPIRED";
  expiresAt: string | null;
  createdAt: string;
}

export interface Platform {
  id: string;
  key: string;
  name: string;
  logoUrl: string | null;
  logoPublicId: string | null;
  status: "LIVE" | "COMING_SOON";
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
