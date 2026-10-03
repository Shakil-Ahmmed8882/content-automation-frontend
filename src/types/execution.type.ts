export type ExecutionStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "FAILED";

export type PublicationStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExecutionListItem {
  id: string;
  status: ExecutionStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  post: { id: string; title: string | null; contentPreview: string };
  platforms: { key: string; name: string; status: PublicationStatus }[];
}

export interface PublicationDetail {
  id: string;
  platform: { key: string; name: string };
  platformAccountName: string | null;
  status: PublicationStatus;
  externalPostId: string | null;
  externalPostUrl: string | null;
  publishedAt: string | null;
  failureReason: string | null;
  retryable: boolean;
  retryCount: number;
}

export interface ExecutionDetail {
  id: string;
  status: ExecutionStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  post: {
    id: string;
    title: string | null;
    content: string;
    imageUrl: string | null;
    isDeleted: boolean;
  };
  publications: PublicationDetail[];
}

export interface ExecutionListParams {
  page?: number;
  limit?: number;
  sort?:
    | "createdAt"
    | "-createdAt"
    | "startedAt"
    | "-startedAt"
    | "completedAt"
    | "-completedAt"
    | string;
  status?: ExecutionStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface StartPublishResult {
  executionId: string;
  status: ExecutionStatus;
}

export interface RetryPublicationResult {
  executionId: string;
  publicationId: string;
}

export interface RetryExecutionResult {
  executionId: string;
  retried: number;
}
