"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const HIGHLIGHTS = [
  { emoji: "🐾", title: "반려동물 동반 조건까지", text: "견종·크기별 동반 조건을 장소마다 확인해요" },
  { emoji: "🗺️", title: "대전 5개 자치구", text: "유성·중·동·대덕·서구를 코스로 묶어 다녀요" },
  { emoji: "✨", title: "성향 기반 추천", text: "우리 아이 MBTI로 어울리는 코스를 받아요" },
];

/** onboarding — 앱 첫 진입 화면. 회원가입 또는 둘러보기(비로그인 탐색)로 갈라진다. */
export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-8 pt-16">
      <div className="text-center">
        <div className="text-4xl">🐶</div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          Dae<span className="text-brand">Journey</span>
          <span className="text-accent-coral">U</span>
        </h1>
        <p className="mt-2 text-xs text-ink-muted">반려동물과 함께하는 대전 여행</p>
      </div>

      <div className="mt-10 flex flex-1 flex-col gap-2.5">
        {HIGHLIGHTS.map((item) => (
          <div key={item.title} className="flex items-center gap-3 rounded-lg border border-line bg-card p-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xl">
              {item.emoji}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-ink">{item.title}</div>
              <div className="text-[11px] text-ink-muted">{item.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <Button variant="primary" onClick={() => router.push("/onboarding/signup")}>
          시작하기
        </Button>
        <Button variant="text" onClick={() => router.replace("/home")}>
          로그인 없이 둘러볼래요
        </Button>
      </div>
    </div>
  );
}
