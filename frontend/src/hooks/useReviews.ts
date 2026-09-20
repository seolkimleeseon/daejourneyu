import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReviewApi,
  deleteReviewApi,
  fetchReviewsApi,
  type ReviewCreateInput,
} from "@/lib/api/reviews";

const REVIEWS_KEY = ["reviews"];

/**
 * GET /api/reviews — placeId를 넘기면 장소 상세용으로 필터링, 안 넘기면 전체(마이탭이 isMine으로 걸러 씀).
 * enabled를 false로 두면 요청을 보내지 않는다 — 장소 상세처럼 placeId가 아직 없는(로딩 중이거나
 * 존재하지 않는 장소인) 동안 의도치 않게 전체 후기를 불러오는 걸 막을 때 쓴다.
 */
export function useReviews(placeId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...REVIEWS_KEY, placeId ?? null],
    queryFn: () => fetchReviewsApi(placeId),
    enabled: options?.enabled ?? true,
  });
}

/** 후기 작성 — 성공하면 목록 캐시를 통째로 무효화해 장소 상세·마이탭에 바로 반영한다. */
export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewCreateInput) => createReviewApi(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REVIEWS_KEY }),
  });
}

/** 내가 쓴 후기 삭제 — 성공하면 목록 캐시를 통째로 무효화해 마이탭·장소 상세에 바로 반영한다. */
export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => deleteReviewApi(reviewId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REVIEWS_KEY }),
  });
}
