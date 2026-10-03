"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as postApi from "@/api/post.api";
import { useAuthCooldown } from "@/hooks/auth.hook";
import type { ListPostsParams, PostSort } from "@/types/post.type";

export const postQueryKeys = {
  all: ["posts"] as const,
  list: (params: Pick<ListPostsParams, "search" | "sort" | "limit">) =>
    [...postQueryKeys.all, params] as const,
  detail: (id: string) => ["post", id] as const,
};

export function useInfinitePosts({
  search = "",
  sort = "-createdAt",
  limit = 10,
}: {
  search?: string;
  sort?: PostSort;
  limit?: number;
}) {
  const cooldown = useAuthCooldown();
  const trimmedSearch = search.trim();
  return useInfiniteQuery({
    queryKey: postQueryKeys.list({ search: trimmedSearch, sort, limit }),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      postApi.getPosts(
        {
          page: pageParam,
          limit,
          sort,
          search: trimmedSearch || undefined,
        },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: cooldown === 0,
  });
}

export function usePost(id: string) {
  const cooldown = useAuthCooldown();
  return useQuery({
    queryKey: postQueryKeys.detail(id),
    queryFn: ({ signal }) => postApi.getPost(id, signal),
    enabled: Boolean(id) && cooldown === 0,
  });
}

export function useCreatePost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: postApi.createPost,
    onSuccess: (post) => {
      client.setQueryData(postQueryKeys.detail(post.id), post);
      void client.invalidateQueries({ queryKey: postQueryKeys.all });
    },
  });
}

export function useDeletePost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: postApi.deletePost,
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: postQueryKeys.detail(id) });
      void client.invalidateQueries({ queryKey: postQueryKeys.all });
    },
  });
}
