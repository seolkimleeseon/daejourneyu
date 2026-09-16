import type { CSSProperties } from "react";
import { MBTI_DECOR_COUNT } from "@/lib/mbti";

interface MbtiCharacterProps {
  code: string;
  name: string;
  size?: number;
}

/** 소품 두 개를 대각선 반대쪽 모서리에 배치하는 4가지 레이아웃 — 항상 우상단/좌하단으로만
 * 몰리지 않도록 유형 코드로 하나를 골라 쓴다. [메인 소품 자리, 보조 소품 자리] 순서. */
const LAYOUTS: Array<[CSSProperties, CSSProperties]> = [
  [{ top: "-4%", right: "-4%" }, { bottom: "-2%", left: "-4%" }],
  [{ top: "-4%", left: "-4%" }, { bottom: "-2%", right: "-4%" }],
  [{ bottom: "-2%", right: "-4%" }, { top: "-4%", left: "-4%" }],
  [{ bottom: "-2%", left: "-4%" }, { top: "-4%", right: "-4%" }],
];

function layoutFor(code: string) {
  const hash = Array.from(code).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return LAYOUTS[hash % LAYOUTS.length];
}

/** 유형별 캐릭터 본체 + 옆에 떠 있는 소품 2개(메인/보조) 애니메이션. 결과 카드/미리보기 공용.
 * 소품 크기·위치를 컨테이너 크기(`size`)에 비례한 %로 둬서, 어떤 크기로 렌더링해도
 * 박스 밖으로 크게 벗어나 옆 타일에 가려지지 않는다.
 *
 * next/image 대신 일반 <img>를 쓴다 — 결과 화면을 이미지로 저장할 때 쓰는 html-to-image가
 * next/image의 최적화 프록시(/_next/image?url=...)를 거친 이미지를 캡처 시점에 못 읽어와
 * 캐릭터가 빈 칸으로 저장되는 문제가 있었다. 로컬 PNG라 최적화 이득도 크지 않아 바꿔도 손해가 없다. */
export function MbtiCharacter({ code, name, size = 112 }: MbtiCharacterProps) {
  const decorCount = MBTI_DECOR_COUNT[code] ?? 0;
  const layout = layoutFor(code);
  const decorSizes = [size * 0.34, size * 0.27];

  return (
    <div className="relative mx-auto my-2" style={{ height: size, width: size }}>
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/icons/mbti-types/${code}.png`}
          alt={name}
          className="h-full w-full object-contain"
        />
      </div>
      {Array.from({ length: decorCount }, (_, i) => (
        <div
          key={i}
          className={i === 0 ? "absolute animate-float" : "absolute animate-twinkle"}
          style={{ ...layout[i], height: decorSizes[i], width: decorSizes[i], animationDelay: `${i * 0.4}s` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/icons/mbti-types/decor/${code}-${i}.png`} alt="" className="h-full w-full object-contain" />
        </div>
      ))}
    </div>
  );
}
