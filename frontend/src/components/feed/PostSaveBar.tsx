"use client";

import { useState } from "react";
import { LoginModal } from "@/components/my/LoginModal";
import { useToggleSave } from "@/hooks/usePosts";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { cn } from "@/lib/cn";

interface PostSaveBarProps {
  postId: string;
  isMine: boolean;
  saves: number;
  saved: boolean;
  /** 카드 하단 줄이 아니라 독립된 줄로 놓일 때(게시물 상세) 테두리·여백을 덧입히기 위한 통로. */
  className?: string;
}

/**
 * 코스 카드 하단 줄(프로토타입 .p-ac). 목록과 게시물 상세가 같이 쓴다 — 좋아요 없이
 * '담긴 수 + 담기 버튼'만 있으면 되므로 화면마다 따로 만들 이유가 없다.
 *
 * 담기는 남의 코스를 **내 보관함에 사본으로 만드는** 동작이라, 결과가 이 화면에 보이지 않는다.
 * 그래서 성공하면 어디로 갔는지 토스트로 알려준다.
 */
export function PostSaveBar({ postId, isMine, saves, saved, className }: PostSaveBarProps) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const showToast = useToastStore((state) => state.show);
  const toggleSave = useToggleSave();
  const [loginOpen, setLoginOpen] = useState(false);

  const handleToggle = () => {
    if (!isLoggedIn) return setLoginOpen(true);
    if (toggleSave.isPending) return;

    toggleSave.mutate(
      { postId, next: !saved },
      {
        onSuccess: (result) =>
          showToast(result.saved ? "내 여정 보관함에 담았어요" : "담기를 취소했어요"),
        onError: (error) => showToast(error.message),
      }
    );
  };

  return (
    <div className={cn("flex items-center gap-3.5 border-t border-line px-4 py-2.5", className)}>
      <span className="text-[11px] font-bold text-accent-coral">📥 {saves}명이 담아감</span>

      {isMine ? (
        <span className="ml-auto text-[11px] font-bold text-brand-700">🐾 내 코스</span>
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          disabled={toggleSave.isPending}
          aria-pressed={saved}
          className={cn(
            "ml-auto rounded-full px-4 py-2 text-[11px] font-bold transition-colors disabled:opacity-60",
            saved ? "bg-surface text-ink-muted" : "bg-brand-500 text-white"
          )}
        >
          {saved ? "담김" : "＋ 담기"}
        </button>
      )}

      {/* 닫혀 있을 때는 아예 띄우지 않는다 — Modal이 항상 전체 화면을 덮는 구조라,
          목록의 카드 수만큼 오버레이가 쌓이면 안 된다. */}
      {loginOpen ? <LoginModal open onClose={() => setLoginOpen(false)} /> : null}
    </div>
  );
}
