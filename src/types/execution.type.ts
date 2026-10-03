export type ExecutionStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "FAILED";

export type PublicationStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

export interface ExecutionListItem {
  id: string;
  status: ExecutionStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  post: { id: string; title: string | null; contentPreview: string };
  platforms: { key: string; name: string; status: PublicationStatus }[];
}
