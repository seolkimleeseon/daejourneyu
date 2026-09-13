/**
 * 넓은(웹) 화면에서 가운데 앱 프레임(max-w-480px) 양옆에 보이는 장식용 패널.
 * 모바일 폭에서는 항상 숨김(`hidden lg:flex`) — 프레임 자체 크기는 모바일과 완전히 동일하게 유지하고,
 * 남는 공간만 채우는 용도라 탭 화면 로직에는 관여하지 않는다.
 * (SVG 필터로 손그림 원을 그려봤는데 렌더링이 깨져서 걷어내고, 반짝임만 듬성듬성 작게 남겼다.)
 */
const SPARKLES: { top: string; left?: string; right?: string; size: string; color: string; delay: string }[] = [
  { top: "10%", left: "20%", size: "text-[10px]", color: "text-brand-300", delay: "0s" },
  { top: "22%", right: "24%", size: "text-[8px]", color: "text-accent-coral", delay: "0.6s" },
  { top: "38%", left: "12%", size: "text-[9px]", color: "text-accent-purple", delay: "1.1s" },
  { top: "62%", right: "14%", size: "text-[9px]", color: "text-brand-300", delay: "0.3s" },
  { top: "72%", left: "24%", size: "text-[8px]", color: "text-accent-purple", delay: "0.9s" },
  { top: "88%", right: "26%", size: "text-[10px]", color: "text-accent-coral", delay: "0.5s" },
];

function Sparkles() {
  return (
    <>
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          aria-hidden
          className={`animate-float absolute ${s.size} ${s.color} opacity-60`}
          style={{ top: s.top, left: s.left, right: s.right, animationDelay: s.delay }}
        >
          ✦
        </span>
      ))}
    </>
  );
}

export function AppBrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[380px] lg:flex-col lg:items-center lg:justify-center lg:gap-5 lg:px-10">
      <Sparkles />

      <div>
        <div className="whitespace-nowrap text-center text-3xl font-extrabold leading-tight tracking-tight text-brand">
          대저니유
        </div>
        <div className="mt-1 whitespace-nowrap text-center text-xs font-semibold tracking-wide text-ink-muted">
          DaeJourneyU
        </div>
      </div>

      <div className="text-center text-sm leading-relaxed text-ink-muted">
        반려동물과 함께하는 대전 여행 플랫폼
      </div>

      <div className="flex flex-col items-center gap-2 text-xs leading-relaxed text-ink-muted">
        <span>🐾 반려동물 동반 가능한 곳만 모아봤어요</span>
        <span>🌳 대전 5개 자치구 코스를 한눈에</span>
        <span>✨ 댕이 여행 MBTI로 코스 추천까지</span>
      </div>
    </div>
  );
}

/** 오른쪽은 균형을 맞추는 여백 — 반짝임만 듬성듬성. */
export function AppDecorPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[380px]">
      <Sparkles />
    </div>
  );
}
