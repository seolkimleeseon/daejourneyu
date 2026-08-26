"use client";

import Link from "next/link";
import type { Article } from "@/types";
import { Card } from "@/components/ui/Card";
import { useFeedStore } from "@/stores/useFeedStore";
import { resolveArticleLike, formatFeedDate } from "@/lib/feed";
import { cn } from "@/lib/cn";

interface ArticleCardProps {
  article: Article;
}

/** 둘러보기 '아티클' 세그 카드. 아티클 상세는 홈 탭과 공유하는 공용 라우트다. */
export function ArticleCard({ article }: ArticleCardProps) {
  const override = useFeedStore((state) => state.articleLikes[article.id]);
  const toggleArticleLike = useFeedStore((state) => state.toggleArticleLike);
  const { liked, likes } = resolveArticleLike(article, override);

  return (
    <Card className="p-0">
      <Link href={`/article/${article.id}`} className="block px-3.5 pb-2 pt-3.5">
        <div className="text-sm font-bold text-ink">📰 {article.title}</div>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{article.summary}</p>
      </Link>

      {/* 좋아요 버튼이 링크 안에 들어가면 a > button 중첩이 되므로 메타 줄만 링크 밖으로 뺀다. */}
      <div className="flex items-center gap-3 px-3.5 pb-3 text-[10px] text-ink-muted">
        <span>{formatFeedDate(article.date)}</span>
        <span>조회 {article.views.toLocaleString()}</span>
        <button
          type="button"
          onClick={() => toggleArticleLike(article.id, !liked)}
          aria-pressed={liked}
          className={cn("font-bold transition-colors", liked ? "text-accent-coral" : "text-ink-muted")}
        >
          {liked ? "❤" : "♡"} {likes}
        </button>
      </div>
    </Card>
  );
}
