"use client";

import Link from "next/link";
import type { FeedPost } from "@/types";
import { Card } from "@/components/ui/Card";
import { useFeedStore } from "@/stores/useFeedStore";
import { resolvePostInteraction, formatStopSummary } from "@/lib/feed";
import { PostActionBar } from "./PostActionBar";

interface PostCardProps {
  post: FeedPost;
}

/** 둘러보기 '코스'·'내 글' 세그에 쓰이는 코스 게시물 카드. 탭하면 게시물 상세로 이동한다. */
export function PostCard({ post }: PostCardProps) {
  const override = useFeedStore((state) => state.overrides[post.id]);
  const interaction = resolvePostInteraction(post, override);

  return (
    <Card className="p-0">
      <Link href={`/feed/post/${post.id}`} className="block p-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg">
            {post.authorEmoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-bold text-ink">{post.authorName}</span>
              {post.sameTypeMatch ? (
                <span className="shrink-0 rounded-full bg-accent-purple-light px-1.5 py-0.5 text-[9px] font-bold text-accent-purple">
                  같은 유형
                </span>
              ) : null}
            </div>
            <div className="truncate text-[10px] text-ink-muted">{post.petTypeName}</div>
          </div>
        </div>

        <div className="mt-2.5 text-sm font-bold text-ink">{post.caption}</div>
        <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{post.text}</p>

        <div className="mt-2 rounded-md bg-surface px-2.5 py-2">
          <div className="text-[9px] font-bold text-brand-700">코스 {post.stops.length}곳</div>
          <div className="mt-0.5 truncate text-[11px] text-ink">{formatStopSummary(post)}</div>
        </div>

        {post.tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {/* 카드 전체가 링크라 태그는 버튼(Tag)이 아니라 표시용 span으로 둔다 — a > button 중첩 방지 */}
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-brand-100 px-2 py-1 text-[10px] font-semibold text-brand-700"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </Link>

      <div className="border-t border-line px-3.5">
        <PostActionBar postId={post.id} interaction={interaction} />
      </div>
    </Card>
  );
}
