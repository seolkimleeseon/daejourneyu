interface TravelingDogProps {
  destination: string;
}

/** 점선길 곡선. 화면에 그리는 <path>와 강아지 span의 offset-path가 이 문자열 하나를 공유해서
 *  강아지가 그려진 길과 완전히 같은 궤적으로 굽이를 타고 올라간다. 좌표계 = 아래 컨테이너 264×128. */
const TRAIL_PATH = "M18 96 Q92 102 138 64 T242 38";

/**
 * 구 선택 → 목록 전환 사이, 강아지가 목적지 핀까지 달려가는 짧은 1회성 로딩 연출.
 * 강아지·핀 모두 이모지 대신 전용 SVG로 그려서 (1) 강아지가 진행 방향(오른쪽)을 바라보게 하고
 * (2) 목적지 마커를 서비스 로고(민트 물방울 핀 + 발바닥, `app/icon.svg`와 동일 형상)로 맞춘다.
 */
export function TravelingDog({ destination }: TravelingDogProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-5 py-16 text-center">
      <div className="relative" style={{ width: 264, height: 128 }}>
        {/* 곡선 점선길 */}
        <svg
          viewBox="0 0 264 128"
          className="absolute inset-0 h-full w-full"
          fill="none"
          aria-hidden
        >
          <path
            d={TRAIL_PATH}
            stroke="var(--color-line-strong)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="1 14"
          />
        </svg>

        {/* 목적지 = 서비스 로고 핀 */}
        <BrandPin className="absolute" style={{ left: 217, top: 0, width: 50, height: 50 }} />

        {/* 곡선길을 그대로 타고 달려가는 강아지 */}
        <span
          className="animate-dog-run absolute"
          style={{
            left: 0,
            top: 0,
            offsetPath: `path("${TRAIL_PATH}")`,
            offsetRotate: "0deg",
            offsetDistance: "0%",
          }}
        >
          <span className="animate-dog-bob flex">
            <RunningDog className="text-ink" style={{ width: 62, height: 62 }} />
          </span>
        </span>
      </div>

      <div className="text-sm font-semibold text-ink-muted">
        <span className="font-bold text-brand">{destination}</span>(으)로 달려가는 중…
      </div>
    </div>
  );
}

/** 오른쪽(목적지)을 향해 달리는 강아지 옆모습. 단색 실루엣 + 민트 반다나 포인트. */
function RunningDog({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 60 44"
      className={className}
      style={style}
      role="img"
      aria-label="달려가는 강아지"
    >
      {/* 속도선 — 진행 방향이 오른쪽임을 강조 */}
      <g stroke="var(--color-steel-400)" strokeWidth="2" strokeLinecap="round">
        <line x1="0" y1="13" x2="7" y2="13" />
        <line x1="1" y1="22" x2="9" y2="22" />
        <line x1="0" y1="31" x2="6" y2="31" />
      </g>

      <g fill="currentColor">
        {/* 꼬리 — 뒤로 치켜올림 */}
        <path d="M12 19c-4-1-7-4-8-8 3 0 6 1 9 4z" strokeLinejoin="round" />
        {/* 다리 — 질주 스탠스 */}
        <g stroke="currentColor" strokeWidth="4" strokeLinecap="round">
          <line x1="19" y1="26" x2="12" y2="37" />
          <line x1="24" y1="27" x2="27" y2="38" />
          <line x1="40" y1="26" x2="36" y2="37" />
          <line x1="44" y1="26" x2="51" y2="37" />
        </g>
        {/* 몸통 */}
        <ellipse cx="28" cy="22" rx="16" ry="9" transform="rotate(-5 28 22)" />
        {/* 머리 */}
        <circle cx="46" cy="17" r="8" />
        {/* 주둥이 */}
        <path d="M52 14c5-1 7 1 7 4s-3 4-7 3z" />
        {/* 귀 — 달릴 때 뒤로 날림 */}
        <path d="M43 10c-3-4-7-3-9 1 2 3 6 4 10 2z" />
      </g>

      {/* 반다나 — 서비스 브랜드 포인트 */}
      <path d="M38 13l9 1-3 10-7-4z" fill="var(--color-brand)" />
      {/* 눈 */}
      <circle cx="47" cy="15.5" r="1.5" fill="var(--color-card)" />
      {/* 코 */}
      <circle cx="58" cy="17.5" r="1.6" fill="var(--color-card)" opacity="0.55" />
    </svg>
  );
}

/** 목적지 마커 = 서비스 로고 핀(민트 물방울 + 흰 발바닥). `app/icon.svg`의 핀 형상과 동일. */
function BrandPin({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      style={style}
      role="img"
      aria-label="목적지"
    >
      <ellipse cx="20" cy="33.5" rx="5" ry="1.6" fill="var(--color-ink)" opacity="0.12" />
      <path
        d="M20 5.5c-5.3 0-9.5 4.1-9.5 9.2 0 6.5 9.5 16.3 9.5 16.3s9.5-9.8 9.5-16.3c0-5.1-4.2-9.2-9.5-9.2z"
        fill="var(--color-brand)"
      />
      <ellipse cx="20" cy="16.4" rx="3" ry="2.5" fill="var(--color-card)" />
      <circle cx="16.4" cy="12.9" r="1.4" fill="var(--color-card)" />
      <circle cx="20" cy="11.1" r="1.5" fill="var(--color-card)" />
      <circle cx="23.6" cy="12.9" r="1.4" fill="var(--color-card)" />
    </svg>
  );
}
