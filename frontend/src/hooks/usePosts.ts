import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FeedPost } from "@/types";
import {
  createPostApi,
  deletePostApi,
  fetchPostsApi,
  type PostCreateInput,
} from "@/lib/api/posts";
import { usePetStore } from "@/stores/usePetStore";

const POSTS_KEY = ["posts"];

/**
 * 둘러보기 게시물 목록(GET /api/posts).
 * `sameTypeMatch`는 "보는 사람"의 반려동물 유형에 따라 달라지는 값이라 서버가 아니라 여기서 붙인다 —
 * 같은 글이라도 누가 보느냐에 따라 '같은 유형' 뱃지가 달라져야 하기 때문이다.
 */
export function usePosts() {
  const activePet = usePetStore((state) => state.activePet());
  const myTypeName = activePet?.mbti?.name ?? null;

  const query = useQuery({ queryKey: POSTS_KEY, queryFn: fetchPostsApi });

  const data = useMemo<FeedPost[]>(
    () =>
      (query.data ?? []).map((post) => ({
        ...post,
        sameTypeMatch: myTypeName !== null && post.petTypeName === myTypeName,
      })),
    [query.data, myTypeName]
  );

  return { ...query, data };
}

/** 게시물 상세 — 목록 캐시를 그대로 재사용하고 id로 골라낸다. */
export function usePost(postId: string) {
  const query = usePosts();
  return {
    ...query,
    data: query.data.find((post) => post.id === postId) ?? null,
  };
}

/** 코스 자랑하기 — 성공하면 목록 캐시를 무효화해 둘러보기에 바로 반영된다. */
export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PostCreateInput) => createPostApi(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: POSTS_KEY }),
  });
}

/** 내 글 삭제. */
export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => deletePostApi(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: POSTS_KEY }),
  });
}
