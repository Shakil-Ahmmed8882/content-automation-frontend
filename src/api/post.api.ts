import apiClient from "@/lib/apiClient";
import type { ListPostsParams, Post, PostsPage } from "@/types/post.type";
import type { CreatePostInput } from "@/validation/post.validation";

function toFormData(input: CreatePostInput) {
  const formData = new FormData();
  const title = input.title?.trim();
  if (title) formData.append("title", title);
  formData.append("content", input.content.trim());
  if (input.image) formData.append("image", input.image);
  return formData;
}

export async function createPost(input: CreatePostInput) {
  return (
    await apiClient<Post>("/posts", {
      method: "POST",
      body: toFormData(input),
    })
  ).data;
}

export async function getPosts(
  params: ListPostsParams = {},
  signal?: AbortSignal,
): Promise<PostsPage> {
  const result = await apiClient<Post[]>("/posts", {
    query: params,
    signal,
  });
  return {
    data: result.data,
    meta: result.meta ?? {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      total: result.data.length,
      totalPages: 1,
    },
  };
}

export async function getPost(id: string, signal?: AbortSignal) {
  return (await apiClient<Post>(`/posts/${id}`, { signal })).data;
}

export async function deletePost(id: string) {
  await apiClient<null>(`/posts/${id}`, { method: "DELETE" });
}
