"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/useAuthStore";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  /** 로그인 성공 후 이어서 진행할 동작 (예: 원래 가려던 화면으로 이동) */
  onLoggedIn?: () => void;
}

type Mode = "login" | "signup";

export function LoginModal({ open, onClose, onLoggedIn }: LoginModalProps) {
  const login = useAuthStore((state) => state.login);
  const signup = useAuthStore((state) => state.signup);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setNickname("");
    setError(null);
    setPending(false);
  };

  const handleClose = () => {
    resetForm();
    setMode("login");
    onClose();
  };

  const handleKakaoLogin = () => {
    const returnTo = typeof window !== "undefined" ? window.location.pathname : "/schedule";
    window.location.href = `/api/auth/kakao/start?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해주세요");
      return;
    }
    if (mode === "signup" && !nickname.trim()) {
      setError("닉네임을 입력해주세요");
      return;
    }

    setPending(true);
    const result = mode === "login" ? await login(email.trim(), password) : await signup(email.trim(), password, nickname.trim());
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    resetForm();
    onClose();
    onLoggedIn?.();
  };

  return (
    <Modal open={open} onClose={handleClose} emoji="🐾" title={mode === "login" ? "로그인" : "회원가입"}>
      <div className="mb-1 flex rounded-lg bg-surface p-1">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={
              mode === m
                ? "flex-1 rounded-md bg-card py-1.5 text-xs font-semibold text-ink shadow-sm"
                : "flex-1 rounded-md py-1.5 text-xs font-semibold text-ink-muted"
            }
          >
            {m === "login" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="이메일"
        autoComplete="email"
        className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-left text-xs text-ink outline-none focus:border-brand"
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder={mode === "signup" ? "비밀번호 (8자 이상)" : "비밀번호"}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-left text-xs text-ink outline-none focus:border-brand"
      />
      {mode === "signup" ? (
        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="닉네임"
          className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-left text-xs text-ink outline-none focus:border-brand"
        />
      ) : null}

      {error ? <div className="px-0.5 text-left text-[11px] text-accent-coral">{error}</div> : null}

      <Button variant="primary" onClick={handleSubmit} disabled={pending}>
        {pending ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
      </Button>

      <div className="flex items-center gap-2 py-0.5">
        <div className="h-px flex-1 bg-line" />
        <span className="text-[10px] text-ink-muted">또는</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      {/* 카카오 브랜드 컬러(#FEE500) — 자체 디자인 토큰이 아니라 카카오 로그인 버튼 가이드라인 고정값이라 raw hex 예외로 둔다. */}
      <button
        type="button"
        onClick={handleKakaoLogin}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] text-sm font-bold text-[#181600]"
      >
        <span>💬</span>카카오로 로그인
      </button>

      <Button variant="text" onClick={handleClose}>
        닫기
      </Button>
    </Modal>
  );
}
