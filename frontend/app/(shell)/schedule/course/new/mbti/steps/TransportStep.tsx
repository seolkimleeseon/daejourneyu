"use client";

import type { Transport } from "@/types";

interface TransportStepProps {
  onPick: (transport: Transport) => void;
}

export function TransportStep({ onPick }: TransportStepProps) {
  return (
    <div className="px-4 pb-6 pt-1">
      <div className="mb-4 text-center text-sm font-bold text-ink">이동 수단을 골라주세요</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPick("자차")}
          className="flex-1 rounded-2xl border border-line bg-card p-4 text-center transition-colors active:border-brand-300 active:bg-brand-100"
        >
          <div className="text-2xl">🚗</div>
          <div className="mt-1 text-xs font-bold text-ink">자차</div>
          <div className="mt-0.5 text-[10px] text-ink-muted">주차 정보 포함</div>
        </button>
        <button
          type="button"
          onClick={() => onPick("대중교통")}
          className="flex-1 rounded-2xl border border-line bg-card p-4 text-center transition-colors active:border-brand-300 active:bg-brand-100"
        >
          <div className="text-2xl">🚌</div>
          <div className="mt-1 text-xs font-bold text-ink">대중교통</div>
          <div className="mt-0.5 text-[10px] text-ink-muted">버스·지하철 기준</div>
        </button>
      </div>
      <div className="mt-4 rounded-lg bg-surface p-4 text-xs leading-relaxed text-ink-muted">
        고른 장소들을 거리순으로 이어 최적 동선을 짜드려요
      </div>
    </div>
  );
}
