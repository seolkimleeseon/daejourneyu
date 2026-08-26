import { useQuery } from "@tanstack/react-query";
import type { FeedPost } from "@/types";
import { mockFeedPosts } from "@/mocks";

// TODO(api): GET /api/posts 로 교체. 지금은 목데이터를 비동기 흉내만 내어 반환한다.
async function fetchPosts(): Promise<FeedPost[]> {
  return mockFeedPosts;
}

export function usePosts() {
  return useQuery({ queryKey: ["posts"], queryFn: fetchPosts });
}

/** 게시물 상세 — 목록 캐시를 그대로 재사용하고 id로 골라낸다. */
export function usePost(postId: string) {
  const query = usePosts();
  return {
    ...query,
    data: query.data?.find((post) => post.id === postId) ?? null,
  };
}
