"use client";

import Link from "next/link";
import type { FeedPost } from "@/types";

interface MyPostCardProps {
  post: FeedPost;
  onDelete: () => void;
}

/** '내 글' 세그 전용 축약 카드. 코스 카드와 달리 제목·요약과 삭제 버튼만 둔다. */
export function MyPostCard({ post, onDelete }: MyPostCardProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-card p-4">
      <Link href={`/feed/post/${post.id}`} className="min-w-0 flex-1">
        {/* 제목은 자르지 않고 단어 단위로 접는다 — 프로토타입 .mypost-cap과 동일 */}
        <div className="break-keep text-sm font-bold leading-snug text-ink">{post.caption}</div>
        <div className="mt-1.5 text-[11px] text-ink-muted">
          {post.stops.length}곳 · 📥 {post.saves}명이 담아감
        </div>
      </Link>
      <button
        type="button"
        onClick={onDelete}
        aria-label="이 글 삭제"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-[13px] text-ink-muted transition-colors hover:bg-accent-coral hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
