"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { useArticle } from "@/hooks/useArticles";
import { useFeedStore } from "@/stores/useFeedStore";
import { resolveArticleLike } from "@/lib/feed";
import { cn } from "@/lib/cn";

/** 둘러보기의 아티클 목록. 탭이 주소에 들어 있어서 돌아가면 '코스'가 아니라 '아티클' 탭이 열린다. */
const ARTICLE_LIST_HREF = "/feed?tab=article";

/** articleDetail — 둘러보기 '아티클' 세그와 홈 탭이 함께 쓰는 공용 라우트. */
export default function ArticleDetailPage() {
  const params = useParams<{ id: string }>();
  const articleId = params.id;
  const router = useRouter();
  const { data: article, isLoading } = useArticle(articleId);
  const override = useFeedStore((state) => state.articleLikes[articleId]);
  const toggleArticleLike = useFeedStore((state) => state.toggleArticleLike);

  /**
   * 들어오기 전 화면(둘러보기·홈)으로 되돌아간다. 공유 링크로 새 탭에서 바로 열면 되돌아갈
   * 기록이 없어 router.back()이 아무 일도 하지 않으므로, 그때만 아티클 목록으로 보낸다.
   */
  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace(ARTICLE_LIST_HREF);
  };

  if (isLoading) {
    return (
      <>
        <TopBar title="아티클" showBack onBack={handleBack} />
        <div className="py-10 text-center text-xs text-ink-muted">불러오는 중…</div>
      </>
    );
  }

  if (!article) {
    return (
      <>
        <TopBar title="아티클" showBack onBack={handleBack} />
        <div className="px-4 py-10 text-center text-xs text-ink-muted">
          아티클을 찾을 수 없어요.
          <div className="mt-3">
            <Link href={ARTICLE_LIST_HREF} replace className="text-brand-700 underline">
              다른 아티클 보러가기
            </Link>
          </div>
        </div>
      </>
    );
  }

  const { liked, likes } = resolveArticleLike(article, override);

  return (
    <>
      <TopBar title="아티클" showBack onBack={handleBack} />
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

        {/* 히스토리에 쌓지 않고 갈아끼운다 — push면 목록에서 뒤로가기를 눌렀을 때 방금 읽은
            아티클로 되돌아와서, 목록 ↔ 상세 사이를 오가며 빠져나가지 못한다. */}
        <Link
          href={ARTICLE_LIST_HREF}
          replace
          className="mt-2.5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 text-xs font-bold text-white shadow-sm"
        >
          📰 다른 아티클 더 보러갈래요
        </Link>
      </article>
    </>
  );
}
