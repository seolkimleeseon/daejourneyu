"use client";

import { useFeedStore } from "@/stores/useFeedStore";
import { cn } from "@/lib/cn";

interface PostSaveBarProps {
  postId: string;
  isMine: boolean;
  saves: number;
  saved: boolean;
}

/**
 * 코스 카드 하단 줄(프로토타입 .p-ac). 목록에서는 좋아요 대신 '담기'만 노출한다 —
 * 게시물 상세의 PostActionBar와는 역할이 달라 별도 컴포넌트로 둔다.
 */
export function PostSaveBar({ postId, isMine, saves, saved }: PostSaveBarProps) {
  const toggleSave = useFeedStore((state) => state.toggleSave);

  return (
    <div className="flex items-center gap-3.5 border-t border-line px-4 py-2.5">
      <span className="text-[11px] font-bold text-accent-coral">📥 {saves}명이 담아감</span>

      {isMine ? (
        <span className="ml-auto text-[11px] font-bold text-brand-700">🐾 내 코스</span>
      ) : (
        <button
          type="button"
          onClick={() => toggleSave(postId, !saved)}
          aria-pressed={saved}
          className={cn(
            "ml-auto rounded-full px-4 py-2 text-[11px] font-bold transition-colors",
            saved ? "bg-surface text-ink-muted" : "bg-brand-500 text-white"
          )}
        >
          {saved ? "담김" : "＋ 담기"}
        </button>
      )}
    </div>
  );
}
