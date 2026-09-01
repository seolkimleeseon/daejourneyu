import { create } from "zustand";

/** 목록/상세에서 각각 로컬 state를 들면 값이 어긋나므로, 토글 결과만 한곳에 모아둔다. */
export interface FeedInteraction {
  liked?: boolean;
  saved?: boolean;
}

interface FeedState {
  /** key = 게시물 id. 사용자가 실제로 토글한 항목만 담긴다(원본과 다른 값). */
  overrides: Record<string, FeedInteraction>;
  /** key = 아티클 id. 아티클은 좋아요만 있어 불리언 하나로 충분하다. */
  articleLikes: Record<string, boolean>;
  toggleLike: (postId: string, next: boolean) => void;
  toggleSave: (postId: string, next: boolean) => void;
  toggleArticleLike: (articleId: string, next: boolean) => void;
}

// 게시물 자체(작성/삭제)는 서버가 정본이라 여기 두지 않는다 — usePosts의 TanStack Query 캐시가 담당한다.
// TODO(api): 좋아요/담기는 POST /api/posts/:id/like · /save 로 교체. 지금은 클라이언트 상태로만 유지한다.
export const useFeedStore = create<FeedState>((set) => ({
  overrides: {},
  articleLikes: {},
  toggleLike: (postId, next) =>
    set((state) => ({
      overrides: { ...state.overrides, [postId]: { ...state.overrides[postId], liked: next } },
    })),
  toggleSave: (postId, next) =>
    set((state) => ({
      overrides: { ...state.overrides, [postId]: { ...state.overrides[postId], saved: next } },
    })),
  toggleArticleLike: (articleId, next) =>
    set((state) => ({ articleLikes: { ...state.articleLikes, [articleId]: next } })),
}));
