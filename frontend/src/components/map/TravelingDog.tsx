interface TravelingDogProps {
  destination: string;
}

/** 구 선택 → 목록 전환 사이, 강아지가 목적지 핀까지 달려가는 짧은 1회성 로딩 연출. */
export function TravelingDog({ destination }: TravelingDogProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-5 py-20 text-center">
      <div className="relative h-10 w-48">
        <div className="absolute left-0 right-2 top-1/2 border-t-2 border-dashed border-line-strong" />
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-lg">📍</span>
        <span
          className="animate-dog-run absolute text-2xl"
          style={{ left: 0, top: "50%" }}
        >
          🐕
        </span>
      </div>
      <div className="text-xs font-semibold text-ink-muted">{destination}(으)로 달려가는 중…</div>
    </div>
  );
}
