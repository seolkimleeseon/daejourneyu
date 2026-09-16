interface PawMarkProps {
  size?: number;
  className?: string;
  /**
   * 'none'(기본) = 배경 없이 발바닥만, currentColor로 색을 입힌다(text-brand 등).
   * 'solid' = AppIcon(solid)처럼 브랜드색 원 배경 + 흰 발바닥. 로고 배지 느낌.
   * 'inverted' = 흰 원 배경 + 브랜드색 테두리 + 브랜드색 발바닥. 카드 위에서 더 차분하게 붙는다.
   */
  circled?: "none" | "solid" | "inverted";
}

/**
 * AppIcon 발바닥 마크에서 핀 윤곽과 배경 사각형을 뺀, 발바닥 모양만 남긴 버전. 캘린더 날짜 칸처럼
 * 작은 자리에서 "그날 축제가 있다"는 걸 점보다 눈에 띄게 표시하는 용도. AppIcon과 정확히 같은
 * 비율로 축소하면 실제 쓰이는 10~14px 크기에서는 발볼/발가락이 뭉개져 그냥 점처럼 보였다 — 발가락을
 * 더 크고 넓게 벌려서 작은 크기에서도 발바닥 모양이 읽히도록 굵게 그렸다.
 */
export function PawMark({ size = 18, className, circled = "none" }: PawMarkProps) {
  const pawFill = circled === "solid" ? "var(--color-card)" : circled === "inverted" ? "var(--color-brand)" : "currentColor";
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className}>
      {circled === "solid" ? <circle cx="8" cy="8" r="8" fill="var(--color-brand)" /> : null}
      {circled === "inverted" ? (
        <circle cx="8" cy="8" r="7.3" fill="var(--color-card)" stroke="var(--color-brand)" strokeWidth="1.2" />
      ) : null}
      <ellipse cx="8" cy="9.5" rx="1.6" ry="1.35" fill={pawFill} />
      <circle cx="5.9" cy="7.1" r="0.95" fill={pawFill} />
      <circle cx="8" cy="6.2" r="1" fill={pawFill} />
      <circle cx="10.1" cy="7.1" r="0.95" fill={pawFill} />
    </svg>
  );
}
