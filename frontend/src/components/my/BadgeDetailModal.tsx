"use client";

import { useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { RARITY_LABEL, type Badge } from "@/lib/badges";
import { cn } from "@/lib/cn";

interface BadgeDetailModalProps {
  /** 열려 있을 때의 대상 뱃지. null이면 닫힌 상태다. */
  badge: Badge | null;
  onClose: () => void;
  onGo: (href: string) => void;
}

/**
 * 요약 그리드의 뱃지 하나를 눌렀을 때 뜨는 상세.
 *
 * 4열 타일에는 획득 조건이 들어갈 자리가 없어서 그리드는 "내가 어디까지 왔나"까지만 답한다.
 * 그 다음 질문("이건 뭘로 받은 거지?" / "이건 뭘 해야 받지?")을 전체 목록 화면까지 가지 않고
 * 그 자리에서 답하는 것이 이 모달의 역할이다 — 그래서 상태에 따라 하는 말이 갈린다.
 *
 * - 이미 받은 뱃지: 무엇으로 받았는지. 단계형이면 다음 단계까지 남은 거리도 같이.
 * - 아직인 뱃지: 획득 조건과 진행도, 그리고 갈 곳이 있으면 그 화면으로 가는 버튼.
 * - 히든: 조건이 비밀이라는 사실만. 진행도를 남기면 조건이 새어나간다.
 */
export function BadgeDetailModal({ badge, onClose, onGo }: BadgeDetailModalProps) {
  // Modal은 닫혀도 DOM에 남아 투명도로만 사라진다. badge가 null이 되는 순간 내용을 지우면
  // 사라지는 동안 빈 상자가 보이므로, 마지막으로 열렸던 뱃지를 그대로 그려둔다.
  const lastBadge = useRef<Badge | null>(null);
  if (badge) lastBadge.current = badge;
  const shown = badge ?? lastBadge.current;

  if (!shown) return <Modal open={false} onClose={onClose} title="" />;

  const masked = shown.hidden && !shown.got;
  const maxed = shown.level >= shown.maxLevel;
  const href = maxed ? undefined : shown.href;
  const showProgress = !masked && !maxed;

  const levelHint =
    shown.got && shown.maxLevel > 1 && !maxed
      ? `다음 단계(Lv.${shown.level + 1})까지 ${shown.target - shown.current}개 남았어요`
      : null;

  return (
    <Modal
      open={Boolean(badge)}
      onClose={onClose}
      title={masked ? "???" : shown.name}
      widthClass="w-[300px]"
    >
      {/* Modal의 emoji prop을 쓰지 않는 이유는 미획득 뱃지를 그리드와 같은 톤으로 흐리게
          보여줘야 하기 때문이다. */}
      <div
        className={cn(
          "mx-auto -mt-1 mb-1 flex h-16 w-16 items-center justify-center rounded-2xl",
          shown.got ? "bg-brand-100" : "bg-surface opacity-40 grayscale"
        )}
      >
        <Emoji3D emoji={masked ? "❔" : shown.emoji} size={40} />
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-ink-muted">
        <span>{shown.category}</span>
        <span aria-hidden>·</span>
        <span>{RARITY_LABEL[shown.rarity]}</span>
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5",
            shown.got ? "bg-brand-100 text-brand-700" : "bg-surface text-ink-muted"
          )}
        >
          {shown.got ? "획득" : "미획득"}
        </span>
      </div>

      <p className="mt-1 text-xs leading-relaxed text-ink">
        {masked
          ? "조건이 비밀인 히든 뱃지예요. 받고 나면 무엇으로 받았는지 알려드릴게요."
          : shown.got
            ? shown.earned
            : shown.how}
      </p>

      {levelHint ? <p className="text-[11px] font-bold text-brand-700">{levelHint}</p> : null}

      {showProgress ? (
        <div>
          <div className="mb-1 flex items-baseline justify-between text-[10px] font-bold text-ink-muted">
            <span>{shown.maxLevel > 1 ? `Lv.${shown.level + 1} 진행도` : "진행도"}</span>
            <span className="text-brand-700">
              {shown.current}/{shown.target}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${Math.min(100, (shown.current / shown.target) * 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* 단계형만 "마지막 단계"라는 말이 성립한다 — 단계가 없는 뱃지엔 다음 단계가 애초에 없다. */}
      {maxed && shown.got && shown.maxLevel > 1 ? (
        <p className="flex items-center justify-center gap-1 text-[11px] font-bold text-brand-700">
          마지막 단계까지 다 모았어요
          <Emoji3D emoji="🎉" size={14} shadow={false} />
        </p>
      ) : null}

      {/* 조건만 알려주고 끝내면 거기서 끊긴다 — 갈 곳이 있는 뱃지는 그 화면으로 보내준다. */}
      {href ? (
        <Button variant="primary" onClick={() => onGo(href)}>
          보러 가기
        </Button>
      ) : null}
      <Button variant="text" onClick={onClose}>
        닫기
      </Button>
    </Modal>
  );
}
