"use client";

import Link from "next/link";
import type { FeedPost } from "@/types";
import { formatPostDate } from "@/lib/feed";

interface HotPostCardProps {
  post: FeedPost;
}

/**
 * '담긴순' 정렬에서 목록 맨 위에 뜨는 최다 저장 코스 배너.
 *
 * 프로토타입 .journey-hot의 진한 그라데이션은 카드 전체가 아니라 상단 3px 민트 줄로만 남겼다 —
 * 브랜드색은 유지하면서 본문은 옅은 민트 위 검은 글씨라 코스 이름이 배경에 묻히지 않는다.
 */
export function HotPostCard({ post }: HotPostCardProps) {
  return (
    <Link
      href={`/feed/post/${post.id}`}
      className="relative block overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 px-3.5 pb-3 pt-3.5 shadow-sm"
    >
      {/* 상단 브랜드 줄 — 브랜드 민트 단색. */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-brand" />
      <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[10px] font-bold text-accent-coral shadow-sm">
        🔥 지금 가장 많이 담아갔어요
      </span>
      <div className="mt-2 text-sm font-extrabold leading-snug text-ink">{post.caption}</div>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-ink-muted">
        <span className="truncate">
          {post.authorName} · {post.stops.length}곳 ·{" "}
          <span className="font-bold text-accent-coral">📥 {post.saves}명이 담아감</span>
        </span>
        {/* 등록일은 줄 오른쪽 끝 — 담긴 수와 붙여 두면 어느 쪽 숫자인지 헷갈린다. */}
        <span className="ml-auto shrink-0">{formatPostDate(post.createdAt)}</span>
      </div>
    </Link>
  );
}
