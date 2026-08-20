interface AppIconProps {
  size?: number;
  className?: string;
  /**
   * 'solid'(기본) = 민트 배경 + 흰 발바닥. 'inverted' = 흰 배경 + 민트 발바닥 —
   * 스플래시 화면처럼 이미 민트(브랜드) 배경 위에 놓여 solid 버전이 묻혀 보이는 자리에서 쓴다.
   */
  variant?: "solid" | "inverted";
}

/**
 * 앱 아이콘(발바닥 마크) — app/icon.svg · app/apple-icon.png · public/icons/icon-*.png(scripts/generate-icons.mjs)
 * 가 전부 이 모양을 출처로 삼는다. 로고 색은 브랜드 아이덴티티 고정값이라 라이트/다크 테마와 무관하게
 * 브랜드 토큰(민트)+카드 화이트로 고정한다.
 */
export function AppIcon({ size = 40, className, variant = "solid" }: AppIconProps) {
  const inverted = variant === "inverted";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="대저니유"
      className={className}
    >
      {inverted ? (
        <rect
          x="0.5"
          y="0.5"
          width="39"
          height="39"
          rx="12"
          fill="var(--color-card)"
          stroke="var(--color-line)"
          strokeWidth="1"
        />
      ) : (
        <rect width="40" height="40" rx="12" fill="var(--color-brand)" />
      )}
      <path
        d="M20 8.5c-4.6 0-8.3 3.6-8.3 8.1 0 5.7 8.3 14.2 8.3 14.2s8.3-8.5 8.3-14.2c0-4.5-3.7-8.1-8.3-8.1z"
        fill={inverted ? "var(--color-brand)" : "var(--color-card)"}
      />
      <ellipse
        cx="20"
        cy="18.7"
        rx="2.8"
        ry="2.4"
        fill={inverted ? "var(--color-card)" : "var(--color-brand)"}
      />
      <circle
        cx="16.7"
        cy="15.6"
        r="1.25"
        fill={inverted ? "var(--color-card)" : "var(--color-brand)"}
      />
      <circle cx="20" cy="14" r="1.35" fill={inverted ? "var(--color-card)" : "var(--color-brand)"} />
      <circle
        cx="23.3"
        cy="15.6"
        r="1.25"
        fill={inverted ? "var(--color-card)" : "var(--color-brand)"}
      />
    </svg>
  );
}
