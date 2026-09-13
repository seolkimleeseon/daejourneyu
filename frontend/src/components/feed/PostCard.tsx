"use client";

import Link from "next/link";
import type { FeedPost } from "@/types";
import { useFeedStore } from "@/stores/useFeedStore";
import { formatPostDate, resolvePostInteraction, visiblePostTags } from "@/lib/feed";
import { PostSaveBar } from "./PostSaveBar";

/** 카드에 펼쳐 보여줄 최대 경유지 수. 나머지는 "⋯ 외 N곳"으로 접는다. */
const VISIBLE_STOPS = 3;

interface PostCardProps {
  post: FeedPost;
}

/** 둘러보기 '코스' 세그에 쓰이는 코스 게시물 카드. 탭하면 게시물 상세로 이동한다. */
export function PostCard({ post }: PostCardProps) {
  const override = useFeedStore((state) => state.overrides[post.id]);
  const interaction = resolvePostInteraction(post, override);
  const hiddenStopCount = post.stops.length - VISIBLE_STOPS;
  const tags = visiblePostTags(post.tags);

  return (
    <article className="overflow-hidden rounded-[21px] border border-line bg-card shadow-sm">
      {/* 목록 카드는 뷰포트 프리페치를 끈다 — 스크롤할 때마다 카드 수만큼 RSC 요청(`?_rsc=`)이
          나가서, 무한 스크롤에서는 실제로 열어보는 한두 개를 위해 수십 건을 낭비한다.
          실제로 탭했을 때 상세를 받아오므로, 낭비되는 건 안 열어본 카드들 몫뿐이다. */}
      <Link href={`/feed/post/${post.id}`} prefetch={false} className="block">
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
          {/* 등록일은 줄 오른쪽 끝. 왼쪽 작성자 블록이 min-w-0이라 이름이 길어도 날짜를 밀어내지 않는다. */}
          <span className="shrink-0 text-[10px] text-ink-muted">
            {formatPostDate(post.createdAt)}
          </span>
        </div>

        <div className="px-4 pb-2.5 text-sm font-bold leading-snug text-ink">{post.caption}</div>
        {post.text ? (
          <p className="px-4 pb-2.5 text-xs leading-relaxed text-ink-muted">{post.text}</p>
        ) : null}

        {/* 동선 상자는 카드 안에서 유일하게 바탕색이 있는 영역이라, 회색 대신 옅은 브랜드색을 깔아
            "이 카드의 알맹이"로 읽히게 한다. 장소 이름은 담을지 말지를 가르는 정보라 본문 색으로 둔다. */}
        <div className="mx-4 mb-2.5 rounded-2xl bg-brand-50 px-3.5 py-2.5">
          {post.stops.slice(0, VISIBLE_STOPS).map((stop, index) => (
            <div key={`${stop.placeId}-${index}`} className="flex gap-2 py-0.5 text-[11px] text-ink">
              <span className="w-3 shrink-0 font-bold text-brand-500">{index + 1}</span>
              <span className="truncate">{stop.name}</span>
            </div>
          ))}
          {hiddenStopCount > 0 ? (
            <div className="flex gap-2 py-0.5 text-[11px] text-ink-muted">
              <span className="w-3 shrink-0 text-center">⋯</span>
              <span>외 {hiddenStopCount}곳</span>
            </div>
          ) : null}
          {/* 카드 전체가 이미 상세로 가는 링크라 이 줄은 버튼이 아니라 **안내 문구**다(중첩 링크 아님) —
              접힌 장소가 있을 때 어디를 눌러야 다 볼 수 있는지 알려주는 역할만 한다. */}
          <div className="pl-5 pt-1 text-[11px] font-semibold text-brand-500">코스 전체 보기 ›</div>
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 px-4 pb-3">
            {/* 카드 전체가 링크라 태그는 버튼(Tag)이 아니라 표시용 span으로 둔다 — a > button 중첩 방지 */}
            {tags.map((tag) => (
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
