"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { useArticle } from "@/hooks/useArticles";
import { useFeedStore } from "@/stores/useFeedStore";
import { resolveArticleLike } from "@/lib/feed";
import { cn } from "@/lib/cn";

/** articleDetail — 둘러보기 '아티클' 세그와 홈 탭이 함께 쓰는 공용 라우트. */
export default function ArticleDetailPage() {
  const params = useParams<{ id: string }>();
  const articleId = params.id;
  const { data: article, isLoading } = useArticle(articleId);
  const override = useFeedStore((state) => state.articleLikes[articleId]);
  const toggleArticleLike = useFeedStore((state) => state.toggleArticleLike);

  if (isLoading) {
    return (
      <>
        <TopBar title="아티클" showBack />
        <div className="py-10 text-center text-xs text-ink-muted">불러오는 중…</div>
      </>
    );
  }

  if (!article) {
    return (
      <>
        <TopBar title="아티클" showBack />
        <div className="px-4 py-10 text-center text-xs text-ink-muted">
          아티클을 찾을 수 없어요.
          <div className="mt-3">
            <Link href="/feed" className="text-brand-700 underline">
              둘러보기로 돌아가기
            </Link>
          </div>
        </div>
      </>
    );
  }

  const { liked, likes } = resolveArticleLike(article, override);

  return (
    <>
      <TopBar title="아티클" showBack />
      <article className="px-4 pb-8 pt-3">
        <div className="text-[10px] text-ink-muted">
          {article.date} · 조회 {article.views.toLocaleString()}
        </div>
        <h1 className="mt-1.5 text-lg font-extrabold leading-snug tracking-tight text-ink">
          {article.title}
        </h1>
        <p className="mt-1.5 text-xs text-ink-muted">{article.summary}</p>

        <div className="mt-4 whitespace-pre-line text-[13px] leading-relaxed text-ink">
          {article.body}
        </div>

        <button
          type="button"
          onClick={() => toggleArticleLike(articleId, !liked)}
          className={cn(
            "mt-6 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border text-xs font-bold transition-colors",
            liked
              ? "border-brand-400 bg-brand-100 text-brand-700"
              : "border-line-strong bg-card text-ink-muted"
          )}
        >
          <span className="text-sm">{liked ? "❤️" : "🤍"}</span>
          도움돼요 {likes}
        </button>
      </article>
    </>
  );
}
