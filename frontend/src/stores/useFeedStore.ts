import { create } from "zustand";

/** 목록/상세에서 각각 로컬 state를 들면 값이 어긋나므로, 토글 결과만 한곳에 모아둔다. */
export interface FeedInteraction {
  liked?: boolean;
}

interface FeedState {
  /** key = 게시물 id. 사용자가 실제로 토글한 항목만 담긴다(원본과 다른 값). */
  overrides: Record<string, FeedInteraction>;
  toggleLike: (postId: string, next: boolean) => void;
}

// 게시물 자체(작성/삭제)와 담기는 서버가 정본이라 여기 두지 않는다 — TanStack Query 캐시가 담당한다.
// 아티클 도움돼요는 서버(/api/articles/:id/like)가 정본이라 여기 두지 않는다 — hooks/useArticleLikes.
// TODO(api): 게시물 좋아요는 아직 서버에 없다(코스 카드는 '담기'만 둔다).
export const useFeedStore = create<FeedState>((set) => ({
  overrides: {},
  toggleLike: (postId, next) =>
    set((state) => ({
      overrides: { ...state.overrides, [postId]: { ...state.overrides[postId], liked: next } },
    })),
}));
