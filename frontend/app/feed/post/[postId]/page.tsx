"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { PostActionBar } from "@/components/feed/PostActionBar";
import { usePost } from "@/hooks/usePosts";
import { useFeedStore } from "@/stores/useFeedStore";
import { resolvePostInteraction } from "@/lib/feed";

/** journeyPostDetail — 둘러보기에서 진입하는 공유 코스 상세. */
export default function FeedPostDetailPage() {
  const params = useParams<{ postId: string }>();
  const postId = params.postId;
  const { data: post, isLoading } = usePost(postId);
  const override = useFeedStore((state) => state.overrides[postId]);

  if (isLoading) {
    return (
      <>
        <TopBar title="공유 코스" showBack />
        <div className="py-10 text-center text-xs text-ink-muted">불러오는 중…</div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <TopBar title="공유 코스" showBack />
        <div className="px-4 py-10 text-center text-xs text-ink-muted">
          게시물을 찾을 수 없어요.
          <div className="mt-3">
            <Link href="/feed" className="text-brand-700 underline">
              둘러보기로 돌아가기
            </Link>
          </div>
        </div>
      </>
    );
  }

  const interaction = resolvePostInteraction(post, override);

  return (
    <>
      <TopBar title="공유 코스" showBack />
      <div className="px-4 pb-8 pt-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl">
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

        <h1 className="mt-3 text-lg font-extrabold tracking-tight text-ink">{post.caption}</h1>
        <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-ink-muted">
          {post.text}
        </p>

        {post.tags.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <Tag key={tag} tone="brand" className="cursor-default px-2 py-1 text-[10px]">
                {tag}
              </Tag>
            ))}
          </div>
        ) : null}

        <div className="mb-1 mt-5 px-1 text-xs font-bold text-ink-muted">
          방문 장소 {post.stops.length}곳
        </div>
        <div className="flex flex-col gap-2">
          {post.stops.map((stop, index) => (
            <Link key={`${stop.placeId}-${index}`} href={`/place/${encodeURIComponent(stop.name)}`}>
              <Card className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-ink">{stop.name}</div>
                  <div className="truncate text-[10px] text-ink-muted">
                    {stop.district} · {stop.category} · {stop.condition}
                  </div>
                </div>
                <span className="shrink-0 text-[9px] text-ink-muted">›</span>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-line bg-card px-3.5">
          <PostActionBar postId={post.id} interaction={interaction} />
        </div>
      </div>
    </>
  );
}
