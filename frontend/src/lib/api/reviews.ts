import { authFetch } from "./authFetch";
import type { Review, ReviewTagOption } from "@/types";

/** GET /api/reviews — placeId를 넘기면 해당 장소만, 안 넘기면 전체(마이탭 "내가 쓴 후기"용). */
export async function fetchReviewsApi(placeId?: string): Promise<Review[]> {
  const query = placeId ? `?placeId=${encodeURIComponent(placeId)}` : "";
  const res = await authFetch(`/api/reviews${query}`);
  if (!res.ok) throw new Error(`GET /api/reviews → ${res.status}`);
  return res.json();
}

/** GET /api/reviews/tags — 후기 작성 화면이 고를 수 있는 태그 사전(분야별로 정렬돼 내려온다). */
export async function fetchReviewTagsApi(): Promise<ReviewTagOption[]> {
  const res = await authFetch("/api/reviews/tags");
  if (!res.ok) throw new Error(`GET /api/reviews/tags → ${res.status}`);
  return res.json();
}

/** 후기 작성 — 사진·본문은 선택, tagCodes는 1~5개(서버가 다시 검증한다). */
export type ReviewCreateInput = {
  placeId: string;
  placeName: string;
  text?: string;
  photoUrl?: string;
  tagCodes: string[];
};

export async function createReviewApi(input: ReviewCreateInput): Promise<Review> {
  const res = await authFetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("후기를 등록하지 못했어요");
  return res.json();
}

/** 내 후기 삭제 — 남의 후기면 서버가 404로 통일해 응답한다. */
export async function deleteReviewApi(id: string): Promise<void> {
  const res = await authFetch(`/api/reviews/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("후기를 삭제하지 못했어요");
}
