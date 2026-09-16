"use client";

/**
 * 16개 유형 캐릭터·소품 조합을 한눈에 보는 내부 QA용 페이지. 정식 진입 동선(탭/버튼)에는
 * 안 걸려 있고 URL로만 접근한다 — 소품 교체·배치 조정 확인용으로 당분간 남겨둔다.
 */

import { TopBar } from "@/components/shell/TopBar";
import { MbtiCharacter } from "@/components/mbti/MbtiCharacter";
import { MBTI_TYPES } from "@/lib/mbti";

export default function MbtiDebugAllPage() {
  const codes = Object.keys(MBTI_TYPES);

  return (
    <>
      <TopBar title="MBTI 캐릭터 전체 미리보기 (테스트용)" showBack />
      <div className="grid grid-cols-3 gap-3 p-4">
        {codes.map((code) => (
          <div key={code} className="rounded-xl border border-line bg-brand-100 pb-2 pt-3 text-center">
            <MbtiCharacter code={code} name={MBTI_TYPES[code].name} size={96} />
            <div className="text-[10px] font-bold text-brand-700">{code}</div>
          </div>
        ))}
      </div>
    </>
  );
}
