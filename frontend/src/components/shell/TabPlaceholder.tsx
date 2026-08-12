interface TabPlaceholderProps {
  emoji: string;
  message: string;
}

/** 다음 스텝에서 채울 탭의 임시 콘텐츠. 라우팅/셸 배선만 먼저 검증하기 위한 자리표시자. */
export function TabPlaceholder({ emoji, message }: TabPlaceholderProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
      <div className="text-4xl">{emoji}</div>
      <div className="text-xs text-ink-muted">{message}</div>
    </div>
  );
}
