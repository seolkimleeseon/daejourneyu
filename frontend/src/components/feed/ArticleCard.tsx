"use client";

import Link from "next/link";
import type { Article } from "@/types";
import { Card } from "@/components/ui/Card";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFeedStore } from "@/stores/useFeedStore";
import { resolveArticleLike, formatFeedDate } from "@/lib/feed";
import { cn } from "@/lib/cn";

interface ArticleCardProps {
  article: Article;
  /**
   * 비로그인 상태에서 좋아요를 눌렀을 때. 좋아요는 "누가" 눌렀는지가 있어야 의미가 있는 값이라
   * 로그인 사용자만 누를 수 있고, 게이팅 모달은 목록을 가진 화면이 하나만 들고 있다
   * (카드마다 모달을 달면 스크롤되는 목록에 모달이 수십 개 붙는다).
   */
  onRequireLogin?: () => void;
}

/** 둘러보기 '아티클' 세그 카드. 아티클 상세는 홈 탭과 공유하는 공용 라우트다. */
export function ArticleCard({ article, onRequireLogin }: ArticleCardProps) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  /** 세션 복구 전에는 로그인 여부를 알 수 없다 — 이때 막으면 로그인 사용자도 게이팅에 걸린다. */
  const authHydrated = useAuthStore((state) => state.hydrated);
  const override = useFeedStore((state) => state.articleLikes[article.id]);
  const toggleArticleLike = useFeedStore((state) => state.toggleArticleLike);
  const { liked, likes } = resolveArticleLike(article, override);

  const handleLike = () => {
    if (!authHydrated) return;
    if (!isLoggedIn) {
      onRequireLogin?.();
      return;
    }
    toggleArticleLike(article.id, !liked);
  };

  return (
    <Card className="p-0">
      {/* 목록 카드는 뷰포트 프리페치를 끈다 — 스크롤할 때마다 카드 수만큼 RSC 요청(`?_rsc=`)이
          나가서, 무한 스크롤에서는 실제로 열어보는 한두 개를 위해 수십 건을 낭비한다.
          실제로 탭했을 때 상세를 받아오므로, 낭비되는 건 안 열어본 카드들 몫뿐이다. */}
      <Link
        href={`/article/${article.id}`}
        prefetch={false}
        className="block px-3.5 pb-2 pt-3.5"
      >
        <div className="flex items-start gap-1.5 text-sm font-bold text-ink">
          <Emoji3D emoji="📰" size={16} shadow={false} />
          <span className="min-w-0 flex-1">{article.title}</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{article.summary}</p>
      </Link>

      {/* 좋아요 버튼이 링크 안에 들어가면 a > button 중첩이 되므로 메타 줄만 링크 밖으로 뺀다. */}
      <div className="flex items-center gap-3 px-3.5 pb-3 text-[10px] text-ink-muted">
        <span>{formatFeedDate(article.date)}</span>
        <span>조회 {article.views.toLocaleString()}</span>
        <button
          type="button"
          onClick={handleLike}
          aria-pressed={liked}
          className={cn(
            "inline-flex items-center gap-1 font-bold transition-colors",
            liked ? "text-accent-coral" : "text-ink-muted"
          )}
        >
          <Emoji3D emoji={liked ? "❤️" : "🤍"} size={12} shadow={false} />
          {likes}
        </button>
      </div>
    </Card>
  );
}
