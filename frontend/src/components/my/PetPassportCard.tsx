"use client";

import type { Pet } from "@/types";

interface PetPassportCardProps {
  pet: Pet | null;
  isLoggedIn: boolean;
  /** 세션 복구가 끝나기 전. 로그인 여부를 아직 모르므로 "미로그인"으로 단정하지 않는다. */
  loading?: boolean;
  onClick: () => void;
}

/**
 * 프로토타입의 .passport 카드 포팅. 견종별 상세 SVG 렌더러는 STEP2 범위 밖이라
 * 아바타는 이모지로 대체했다 — TODO(step3): 실제 반려동물 사진/일러스트로 교체.
 */
export function PetPassportCard({ pet, isLoggedIn, loading, onClick }: PetPassportCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden rounded-xl border border-line bg-card text-left shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-brand-300 bg-brand-100 px-4 py-2">
        <span className="text-xs font-extrabold text-brand-700">반려동물 여권</span>
        <span className="font-mono text-[8px] font-bold tracking-[1.5px] text-brand-700/60">
          DAEJEON
        </span>
      </div>

      <div className="flex items-center gap-3.5 px-4 py-4">
        <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-xl border-2 border-brand-300 bg-brand-100 text-3xl">
          {pet?.emoji ?? "🐾"}
        </div>

        {loading ? (
          <div className="flex-1 text-center">
            <div className="text-sm font-extrabold text-brand-700">불러오는 중…</div>
            <div className="mt-1 text-[11px] text-ink-muted">여권 정보를 확인하고 있어요</div>
          </div>
        ) : !isLoggedIn ? (
          <div className="flex-1 text-center">
            <div className="text-sm font-extrabold text-brand-700">로그인이 필요해요</div>
            <div className="mt-1 text-[11px] text-ink-muted">탭해서 로그인하기 →</div>
          </div>
        ) : !pet ? (
          <div className="flex-1 text-center">
            <div className="text-sm font-extrabold text-brand-700">반려동물 미등록</div>
            <div className="mt-1 text-[11px] text-ink-muted">탭해서 반려동물을 등록해보세요 →</div>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 text-base font-extrabold tracking-tight text-brand-700">
              {pet.name}
            </div>
            <PassportRow label="견종" value={pet.breed} />
            <PassportRow label="몸무게 · 나이" value={`${pet.weightKg}kg · ${pet.ageYears}살`} />
            <PassportRow label="여행 유형" value={pet.mbti ? pet.mbti.code : "미검사"} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-brand-300 bg-brand-100 px-4 py-2 text-[10px] font-semibold tracking-wide text-brand-700">
        <span>PET PASSPORT</span>
        <span>상세보기</span>
      </div>
    </button>
  );
}

function PassportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2.5 py-0.5">
      <span className="whitespace-nowrap text-[11px] font-medium text-ink-muted">{label}</span>
      <span className="truncate text-xs font-semibold text-ink">{value}</span>
    </div>
  );
}
