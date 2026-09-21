import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchArticleLikes,
  setArticleLikeApi,
  type ArticleLikesResponse,
} from "@/lib/api/articleLikes";
import { useAuthStore } from "@/stores/useAuthStore";

const QUERY_KEY = ["article-likes"] as const;

/**
 * 아티클 도움돼요 상태(전체 수 + 내가 누른 것). 세션 확인 뒤에 불러온다 — 확인 전에 부르면
 * 로그인한 사용자도 "누른 것 없음"으로 받아 버튼이 잠깐 꺼져 보인다.
 * 실패해도 화면은 목데이터의 기본 수로 계속 그려지므로 재시도 없이 조용히 빈 값으로 둔다.
 */
export function useArticleLikes() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    // 로그인 상태가 바뀌면 "내가 누른 것"이 달라지므로 키에 넣어 새로 받는다.
    queryKey: [...QUERY_KEY, isLoggedIn],
    queryFn: fetchArticleLikes,
    enabled: hydrated,
    staleTime: 30_000,
    retry: false,
  });
}

export function useToggleArticleLike() {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const key = [...QUERY_KEY, isLoggedIn];

  return useMutation({
    mutationFn: ({ articleId, next }: { articleId: string; next: boolean }) =>
      setArticleLikeApi(articleId, next),
    // 누르는 즉시 화면에 반영하고, 서버가 거절하면 되돌린다.
    onMutate: async ({ articleId, next }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ArticleLikesResponse>(key);
      const current = previous ?? { counts: {}, likedIds: [] };
      const alreadyLiked = current.likedIds.includes(articleId);
      if (alreadyLiked !== next) {
        queryClient.setQueryData<ArticleLikesResponse>(key, {
          counts: { ...current.counts, [articleId]: Math.max(0, (current.counts[articleId] ?? 0) + (next ? 1 : -1)) },
          likedIds: next ? [...current.likedIds, articleId] : current.likedIds.filter((id) => id !== articleId),
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      else queryClient.removeQueries({ queryKey: key });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
