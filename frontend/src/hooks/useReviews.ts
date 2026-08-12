import { useQuery } from "@tanstack/react-query";
import type { Review } from "@/types";
import { mockReviews } from "@/mocks";

// TODO(api): GET /api/reviews 로 교체. 지금은 목데이터를 비동기 흉내만 내어 반환한다.
async function fetchReviews(): Promise<Review[]> {
  return mockReviews;
}

export function useReviews() {
  return useQuery({ queryKey: ["reviews"], queryFn: fetchReviews });
}
