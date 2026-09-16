import { Emoji3D } from "@/components/ui/Emoji3D";

interface TabPlaceholderProps {
  emoji: string;
  message: string;
  /** 3D 렌더 아이콘(Emoji3D)을 쓸지 여부. TileButton과 같은 패턴 — 기본은 평면 이모지 그대로다. */
  icon3D?: boolean;
}

/** 다음 스텝에서 채울 탭의 임시 콘텐츠. 라우팅/셸 배선만 먼저 검증하기 위한 자리표시자. */
export function TabPlaceholder({ emoji, message, icon3D = false }: TabPlaceholderProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
      {icon3D ? <Emoji3D emoji={emoji} size={48} /> : <div className="text-4xl">{emoji}</div>}
      <div className="text-xs text-ink-muted">{message}</div>
    </div>
  );
}
