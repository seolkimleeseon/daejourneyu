"use client";

import Link from "next/link";
import type { Article } from "@/types";
import { Card } from "@/components/ui/Card";

interface ArticleCardProps {
  article: Article;
}

/** 둘러보기 '아티클' 세그 카드. 아티클 상세는 홈 탭과 공유하는 공용 라우트다. */
export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="p-0">
      <Link href={`/article/${article.id}`} className="block p-3.5">
        <div className="text-[10px] text-ink-muted">{article.date}</div>
        <div className="mt-1 text-sm font-bold text-ink">{article.title}</div>
        <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{article.summary}</p>
        <div className="mt-2 flex gap-3 text-[10px] text-ink-muted">
          <span>❤️ {article.likes}</span>
          <span>👁 {article.views.toLocaleString()}</span>
        </div>
      </Link>
    </Card>
  );
}
