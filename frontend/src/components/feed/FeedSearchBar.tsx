"use client";

interface FeedSearchBarProps {
  /** 입력창에 보이는 글자. 타이핑은 여기까지만 반영되고 목록은 건드리지 않는다. */
  value: string;
  onChange: (value: string) => void;
  /** 실제로 검색할 때 호출된다 — 엔터를 치거나 입력을 비웠을 때. */
  onSubmit: (value: string) => void;
}

/**
 * 코스 탭 전용 장소 검색바.
 *
 * 타이핑 중에는 검색하지 않고 **엔터를 쳐야** 목록이 바뀐다. 검색이 서버 호출로 바뀌면서
 * 한 글자마다 요청이 나가는 게 부담스러워졌고, 어차피 장소명은 끝까지 치고 확정하는 입력이다.
 * 다만 입력을 비우는 건 예외로 즉시 반영한다 — ×로 지웠는데 검색 결과가 그대로 남아 있으면
 * 전체 목록으로 어떻게 돌아가는지 알 수 없다.
 */
export function FeedSearchBar({ value, onChange, onSubmit }: FeedSearchBarProps) {
  const handleChange = (next: string) => {
    onChange(next);
    if (next.trim().length === 0) onSubmit("");
  };

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <input
        type="search"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        enterKeyHint="search"
        placeholder="🔍 장소로 코스 검색 후 엔터 (예: 한빛탑)"
        aria-label="장소로 코스 검색"
        className="w-full rounded-xl border border-line-strong bg-card px-3.5 py-2.5 text-xs text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-brand-500"
      />
    </form>
  );
}
