"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { LoginModal } from "@/components/my/LoginModal";
import { useArticle } from "@/hooks/useArticles";
import { usePlaces } from "@/hooks/usePlaces";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFeedStore } from "@/stores/useFeedStore";
import { parseArticleBody, resolveArticleLike } from "@/lib/feed";
import { cn } from "@/lib/cn";

/** 둘러보기의 아티클 목록. 탭이 주소에 들어 있어서 돌아가면 '코스'가 아니라 '아티클' 탭이 열린다. */
const ARTICLE_LIST_HREF = "/feed?tab=article";

/** 로드에 실패하면 자리만 조용히 접는다 — 사진 여러 장 중 하나가 깨져도 본문 전체가 어색해지지 않게. */
function ArticleImage({ src, className }: { src: string; className: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

/** articleDetail — 둘러보기 '아티클' 세그와 홈 탭이 함께 쓰는 공용 라우트. */
export default function ArticleDetailPage() {
  const params = useParams<{ id: string }>();
  const articleId = params.id;
  const router = useRouter();
  const { data: article, isLoading } = useArticle(articleId);
  const { data: places = [] } = usePlaces();
  const override = useFeedStore((state) => state.articleLikes[articleId]);
  const toggleArticleLike = useFeedStore((state) => state.toggleArticleLike);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  /** 세션 복구 전에는 로그인 여부를 알 수 없다 — 이때 막으면 로그인 사용자도 게이팅에 걸린다. */
  const authHydrated = useAuthStore((state) => state.hydrated);
  const [loginOpen, setLoginOpen] = useState(false);

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
  const bodyBlocks = parseArticleBody(article.body);
  const inlineImages = article.images ?? [];

  /** 좋아요는 "누가" 눌렀는지가 있어야 의미가 있는 값이라 로그인 사용자만 누를 수 있다. */
  const handleLike = () => {
    if (!authHydrated) return;
    if (!isLoggedIn) {
      setLoginOpen(true);
      return;
    }
    toggleArticleLike(articleId, !liked);
  };

  return (
    <>
      <TopBar title="아티클" showBack onBack={handleBack} />
      <article className="px-4 pb-8 pt-3">
        <div className="border-b border-line pb-4">
          <div className="text-[10px] text-ink-muted">
            {article.date} · 조회 {article.views.toLocaleString()}
          </div>
          <h1 className="mt-1.5 text-xl font-extrabold leading-snug tracking-tight text-ink">
            {article.title}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">{article.summary}</p>
        </div>

        {article.imageUrl ? (
          <ArticleImage src={article.imageUrl} className="mt-4 h-48 w-full rounded-xl object-cover" />
        ) : null}

        <div className="mt-2 text-[13px] leading-relaxed text-ink">
          {(() => {
            let nextImageIndex = 0;
            return bodyBlocks.map((block, i) => {
              if (block.type === "heading") {
                const image = inlineImages[nextImageIndex];
                nextImageIndex += 1;
                return (
                  <div key={i}>
                    <h2 className="mb-2 mt-6 border-l-[3px] border-brand-500 pl-2 text-[15px] font-extrabold text-brand-700">
                      {block.text}
                    </h2>
                    {image ? (
                      <ArticleImage src={image} className="mb-3 h-40 w-full rounded-xl object-cover" />
                    ) : null}
                  </div>
                );
              }
              return (
                <p key={i} className="mb-3 whitespace-pre-line">
                  {block.text}
                </p>
              );
            });
          })()}
        </div>

        {article.places && article.places.length > 0 ? (
          <div className="mt-6 border-t border-line pt-4">
            <div className="mb-2 text-xs font-bold text-ink-muted">이 아티클에 나온 장소</div>
            <div className="flex flex-col gap-2">
              {article.places.map((name) => {
                const place = places.find((p) => p.name === name);
                return (
                  <Link
                    key={name}
                    href={`/place/${encodeURIComponent(name)}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-card px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-ink">{name}</div>
                      {place ? (
                        <div className="mt-0.5 truncate text-[10px] text-ink-muted">
                          {place.district} · {place.condition}
                        </div>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[11px] font-bold text-brand-700">상세보기 ›</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleLike}
          className={cn(
            "mt-6 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border text-xs font-bold transition-colors",
            liked
              ? "border-brand-400 bg-brand-100 text-brand-700"
              : "border-line-strong bg-card text-ink-muted"
          )}
        >
          <Emoji3D emoji={liked ? "❤️" : "🤍"} size={16} shadow={false} />
          도움돼요 {likes}
        </button>

        {/* 히스토리에 쌓지 않고 갈아끼운다 — push면 목록에서 뒤로가기를 눌렀을 때 방금 읽은
            아티클로 되돌아와서, 목록 ↔ 상세 사이를 오가며 빠져나가지 못한다. */}
        <Link
          href={ARTICLE_LIST_HREF}
          replace
          className="mt-2.5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 text-xs font-bold text-white shadow-sm"
        >
          <Emoji3D emoji="📰" size={16} shadow={false} />
          다른 아티클 더 보러갈래요
        </Link>
      </article>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
