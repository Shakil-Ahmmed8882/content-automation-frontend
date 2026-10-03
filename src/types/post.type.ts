export interface Post {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type PostSort = "-createdAt" | "createdAt" | "title" | "-title";

export interface ListPostsParams {
  page?: number;
  limit?: number;
  sort?: PostSort;
  search?: string;
}

export interface PostsPage {
  data: Post[];
  meta: ListMeta;
}
