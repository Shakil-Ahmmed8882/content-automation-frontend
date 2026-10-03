import type { Platform } from "./platform.type";

export type { Platform };

export interface Connection {
  id: string;
  platform: { key: string; name: string };
  platformAccountName: string | null;
  status: "CONNECTED" | "EXPIRED";
  expiresAt: string | null;
  createdAt: string;
}

export interface ConnectionAuthUrl {
  authUrl: string;
}

export interface FacebookPage {
  id: string;
  name: string;
}

export type ConnectionCallbackResult =
  | { kind: "connected"; connection: Connection }
  | { kind: "select-page"; pages: FacebookPage[] };

export interface ConnectedPlatformKey {
  key: string;
  name: string;
  status: "CONNECTED" | "EXPIRED";
  accountName: string | null;
}
