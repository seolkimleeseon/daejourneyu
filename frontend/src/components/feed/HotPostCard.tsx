"use client";

import Link from "next/link";
import type { FeedPost } from "@/types";

interface HotPostCardProps {
  post: FeedPost;
}

/**
 * '담긴순' 정렬에서 목록 맨 위에 뜨는 최다 저장 코스 배너.
 * 그라데이션은 프로토타입 .journey-hot 값 그대로다 — 끝의 앰버는 토큰에 없어 리터럴로 둔다.
 */
export function HotPostCard({ post }: HotPostCardProps) {
  return (
    <Link
      href={`/feed/post/${post.id}`}
      className="block overflow-hidden rounded-2xl p-3.5 shadow-md"
      style={{
        background:
          "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-400) 58%, #f4c542 150%)",
      }}
    >
      <div className="text-[10px] font-bold text-white/95">👑 지금 가장 많이 담아갔어요</div>
      <div className="mt-2 text-xs font-bold leading-snug text-white">{post.caption}</div>
      <div className="mt-1 text-[10px] text-white/90">
        {post.authorName} · {post.stops.length}곳 · 📥 {post.saves}명이 담아감
      </div>
    </Link>
  );
}
