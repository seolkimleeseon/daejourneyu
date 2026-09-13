interface FeedEmptyStateProps {
  emoji: string;
  title: string;
  description: string;
}

/** 둘러보기 각 탭의 빈 상태(프로토타입 .empty). 이모지 + 제목 + 안내 한 줄 구성이다. */
export function FeedEmptyState({ emoji, title, description }: FeedEmptyStateProps) {
  return (
    <div className="px-8 py-8 text-center">
      <div className="text-[40px]">{emoji}</div>
      <div className="mb-1.5 mt-3 text-sm font-bold text-ink">{title}</div>
      <div className="text-xs leading-relaxed text-ink-muted">{description}</div>
    </div>
  );
}
