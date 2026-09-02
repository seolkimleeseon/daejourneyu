import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * 평면 이모지 대신 쓰는 3D 렌더 아이콘(토스류 서비스에서 쓰는 스타일).
 * 출처: Microsoft Fluent Emoji 3D(MIT) — `public/icons/3d/`에 내려받아 셀프 호스팅한다.
 * 여기 매핑에 없는 이모지는 원래 문자를 그대로 보여준다 — 커버리지를 넓힐 때 이 표에만 추가하면 된다.
 */
const EMOJI_3D_MAP: Record<string, string> = {
  "✨": "/icons/3d/sparkles_3d.png",
  "🤖": "/icons/3d/robot_3d.png",
  "📍": "/icons/3d/round_pushpin_3d.png",
  "🔖": "/icons/3d/bookmark_3d.png",
  "🐾": "/icons/3d/paw_prints_3d.png",
  "🌳": "/icons/3d/deciduous_tree_3d.png",
  "🎾": "/icons/3d/tennis_3d.png",
  "🍖": "/icons/3d/meat_on_bone_3d.png",
  "🎨": "/icons/3d/artist_palette_3d.png",
  "🥐": "/icons/3d/croissant_3d.png",
  "🏛️": "/icons/3d/classical_building_3d.png",
  "🎯": "/icons/3d/bullseye_3d.png",
};

interface Emoji3DProps {
  emoji: string;
  /** px 단위 정사각 크기. */
  size?: number;
  className?: string;
  /** 아이콘 뒤에 번지는 은은한 색 블롭(Tailwind bg 클래스, 예: "bg-brand-300"). 단색 배경 위에서
   * 아이콘이 딱딱한 사각 칩 안에 박혀 보이지 않고 공중에 떠 있는 것처럼 보이게 한다. */
  glowClassName?: string;
  /** 바닥에 닿는 듯한 접지 그림자. 평면 이모지가 아니라 진짜 렌더라는 걸 알아보게 하는 디테일이라
   * 기본으로 켜져 있다 — 아주 작은 인라인 아이콘 등에서만 false로 끈다. */
  shadow?: boolean;
}

export function Emoji3D({ emoji, size = 28, className, glowClassName, shadow = true }: Emoji3DProps) {
  const src = EMOJI_3D_MAP[emoji];

  if (!src) {
    return (
      <span className={cn("inline-block leading-none", className)} style={{ fontSize: size * 0.75 }}>
        {emoji}
      </span>
    );
  }

  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {glowClassName ? (
        <span
          aria-hidden
          className={cn("absolute rounded-full opacity-35 blur-md", glowClassName)}
          style={{ width: size * 0.75, height: size * 0.75 }}
        />
      ) : null}
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn(
          "relative inline-block shrink-0 select-none",
          shadow && "drop-shadow-[0_3px_4px_rgba(0,0,0,0.12)]",
          className
        )}
        draggable={false}
      />
    </span>
  );
}
