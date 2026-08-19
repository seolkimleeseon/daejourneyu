"use client";

import { useFeedStore } from "@/stores/useFeedStore";
import type { ResolvedPostInteraction } from "@/lib/feed";
import { cn } from "@/lib/cn";

interface PostActionBarProps {
  postId: string;
  interaction: ResolvedPostInteraction;
}

/** 좋아요 / 저장 토글. 카드와 상세가 같은 스토어를 보므로 두 화면의 값이 항상 일치한다. */
export function PostActionBar({ postId, interaction }: PostActionBarProps) {
  const toggleLike = useFeedStore((state) => state.toggleLike);
  const toggleSave = useFeedStore((state) => state.toggleSave);

  return (
    <div className="flex items-center gap-4 py-2.5">
      <ActionButton
        active={interaction.liked}
        label={`좋아요 ${interaction.likes}`}
        emoji={interaction.liked ? "❤️" : "🤍"}
        onClick={() => toggleLike(postId, !interaction.liked)}
      />
      <ActionButton
        active={interaction.saved}
        label={`저장 ${interaction.saves}`}
        emoji={interaction.saved ? "🔖" : "📄"}
        onClick={() => toggleSave(postId, !interaction.saved)}
      />
    </div>
  );
}

interface ActionButtonProps {
  active: boolean;
  label: string;
  emoji: string;
  onClick: () => void;
}

function ActionButton({ active, label, emoji, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 text-[11px] font-semibold transition-colors",
        active ? "text-brand-700" : "text-ink-muted"
      )}
    >
      <span className="text-sm">{emoji}</span>
      {label}
    </button>
  );
}
