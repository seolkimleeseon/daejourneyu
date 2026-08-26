"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LoginModal } from "@/components/my/LoginModal";

interface LoginRequiredGateProps {
  message?: string;
  /** 페이지에 다른 콘텐츠(예: 코스 만들기 타일)가 함께 있어 이 가드가 화면을 독차지하면 안 되는 곳에서 쓰는 얇은 배너형. */
  compact?: boolean;
}

/** 코스 저장/보관함처럼 로그인 회원 전용 영역에서 쓰는 공용 가드. */
export function LoginRequiredGate({ message = "코스를 저장하고 관리하려면 로그인해주세요", compact = false }: LoginRequiredGateProps) {
  const [loginOpen, setLoginOpen] = useState(false);

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3.5">
        <span className="shrink-0 text-xl">🐾</span>
        <div className="min-w-0 flex-1 text-xs leading-relaxed text-ink-muted">{message}</div>
        <Button className="min-h-9 w-auto shrink-0 px-3 text-xs" onClick={() => setLoginOpen(true)}>
          로그인
        </Button>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="text-4xl">🐾</div>
      <div className="text-sm font-bold text-ink">로그인이 필요해요</div>
      <div className="text-xs leading-relaxed text-ink-muted">{message}</div>
      <Button className="mt-2 w-auto px-6" onClick={() => setLoginOpen(true)}>
        로그인하기
      </Button>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
