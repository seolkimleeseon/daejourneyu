interface BakeryLoadingProps {
  stage?: "bakeries" | "walks";
}

/** 네트워크 응답을 기다리는 동안 코스의 형태와 현재 단계를 보여준다. */
export function BakeryLoading({ stage = "bakeries" }: BakeryLoadingProps) {
  return (
    <div className="px-5 pb-8" role="status" aria-live="polite">
      <div className="rounded-2xl bg-accent-amber-light px-5 py-5 text-center">
        <div className="text-3xl" aria-hidden="true">🥐</div>
        <div className="mt-2 text-sm font-bold text-ink">
          {stage === "bakeries" ? "동네 빵집 후보를 찾고 있어요" : "가까운 산책길을 연결하고 있어요"}
        </div>
        <div className="mt-1 text-xs text-ink-muted">지역은 기다리는 동안 바꿀 수 있어요</div>
        <div className="mt-4 flex items-center justify-center gap-2" aria-hidden="true">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent-amber" />
          <span className="h-1 w-10 rounded-full bg-accent-amber/40" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
          <span className="h-1 w-10 rounded-full bg-brand/40" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent-amber" />
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-card" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex items-center gap-3 border-b border-line px-4 py-4 last:border-b-0">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-accent-amber-light" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded bg-line" />
              <div className="h-2.5 w-1/2 animate-pulse rounded bg-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
