"use client";

import Link from "next/link";
import type { FeedPost } from "@/types";
import { useFeedStore } from "@/stores/useFeedStore";
import { resolvePostInteraction } from "@/lib/feed";
import { PostSaveBar } from "./PostSaveBar";

/** 카드에 펼쳐 보여줄 최대 경유지 수. 나머지는 "＋ N곳 더"로 접는다. */
const VISIBLE_STOPS = 3;

interface PostCardProps {
  post: FeedPost;
}

/** 둘러보기 '코스' 세그에 쓰이는 코스 게시물 카드. 탭하면 게시물 상세로 이동한다. */
export function PostCard({ post }: PostCardProps) {
  const override = useFeedStore((state) => state.overrides[post.id]);
  const interaction = resolvePostInteraction(post, override);
  const hiddenStopCount = post.stops.length - VISIBLE_STOPS;

  return (
    <article className="overflow-hidden rounded-[21px] border border-line bg-card shadow-sm">
      <Link href={`/feed/post/${post.id}`} className="block">
        <div className="flex items-center gap-2.5 px-4 pb-2.5 pt-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg">
            {post.authorEmoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-xs font-bold text-ink">{post.authorName}</span>
              {post.isMine ? (
                <span className="shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-700">
                  내 글
                </span>
              ) : null}
            </div>
            <div className="truncate text-[10px] text-ink-muted">{post.petTypeName}</div>
          </div>
          {post.sameTypeMatch && !post.isMine ? (
            <span className="shrink-0 rounded-full bg-accent-purple-light px-1.5 py-0.5 text-[9px] font-bold text-accent-purple">
              같은 유형
            </span>
          ) : null}
        </div>

        <div className="px-4 pb-2.5 text-sm font-bold leading-snug text-ink">{post.caption}</div>
        {post.text ? (
          <p className="px-4 pb-2.5 text-xs leading-relaxed text-ink-muted">{post.text}</p>
        ) : null}

        <div className="mx-4 mb-2.5 rounded-2xl bg-surface px-3.5 py-2.5">
          {post.stops.slice(0, VISIBLE_STOPS).map((stop, index) => (
            <div key={stop.placeId} className="flex gap-2 py-0.5 text-[11px] text-ink-muted">
              <span className="w-3 shrink-0 font-bold text-brand-500">{index + 1}</span>
              <span className="truncate">{stop.name}</span>
            </div>
          ))}
          <div className="pl-5 pt-1 text-[11px] font-semibold text-brand-500">
            {hiddenStopCount > 0
              ? `＋ ${hiddenStopCount}곳 더 · 코스 전체 보기 ›`
              : "코스 전체 보기 ›"}
          </div>
        </div>

        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 px-4 pb-3">
            {/* 카드 전체가 링크라 태그는 버튼(Tag)이 아니라 표시용 span으로 둔다 — a > button 중첩 방지 */}
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface px-2 py-1 text-[10px] font-semibold text-ink-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </Link>

      <PostSaveBar
        postId={post.id}
        isMine={post.isMine}
        saves={interaction.saves}
        saved={interaction.saved}
      />
    </article>
  );
}
