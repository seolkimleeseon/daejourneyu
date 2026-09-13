"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/onboarding/FormField";
import { KakaoLoginButton } from "@/components/onboarding/KakaoLoginButton";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { markOnboardingSeen } from "@/lib/onboarding";
import type { AuthFieldErrors } from "@/lib/api/auth";

/**
 * 백엔드 콜백(`/api/auth/kakao/callback`)이 붙여 보내는 error 코드 → 화면 문구.
 * 실패 지점마다 코드가 다르므로 문구만 보고 어디서 끊겼는지 구분할 수 있다.
 */
const KAKAO_ERROR_MESSAGES: Record<string, string> = {
  kakao_state: "로그인 요청이 만료됐어요. 다시 시도해주세요",
  kakao_denied: "카카오 로그인이 취소됐어요",
  kakao_config: "서버에 카카오 로그인 설정이 없어요. backend/.env를 확인해주세요",
  kakao_api: "카카오 서버와 통신하지 못했어요. 잠시 후 다시 시도해주세요",
  kakao_db: "로그인 정보를 저장하지 못했어요. 데이터베이스가 떠 있는지 확인해주세요",
  // 위 어디에도 해당하지 않는 예상 밖의 실패
  kakao_failed: "카카오 로그인에 실패했어요. 잠시 후 다시 시도해주세요",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-xs text-ink-muted">불러오는 중…</div>}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  /** 로그인 게이팅에 걸려 넘어온 경우 원래 보려던 화면으로 되돌려 보낸다. */
  const next = searchParams.get("next");

  const login = useAuthStore((state) => state.login);
  const showToast = useToastStore((state) => state.show);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /** 카카오 콜백이 실패하면 이 화면으로 error 파라미터를 달고 돌아온다. */
  const kakaoError = KAKAO_ERROR_MESSAGES[searchParams.get("error") ?? ""];

  const handleSubmit = async () => {
    setPending(true);
    setFormError(null);
    setErrors({});

    const result = await login({ email: email.trim(), password });
    setPending(false);

    if (!result.ok) {
      setErrors(result.errors ?? {});
      setFormError(result.errors ? null : result.message ?? "로그인에 실패했어요");
      return;
    }

    markOnboardingSeen();
    showToast(`${result.user.nickname}님, 반가워요!`);
    router.replace(next ?? "/home");
  };

  return (
    <>
      <TopBar title="로그인" showBack />
      <div className="flex flex-col gap-3.5 px-5 pb-8 pt-4">
        {kakaoError ? (
          <p className="rounded-lg bg-accent-coral-light px-3 py-2 text-[11px] text-accent-coral">
            {kakaoError}
          </p>
        ) : null}

        <KakaoLoginButton next={next} />

        <div className="flex items-center gap-2 py-1">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[10px] text-ink-muted">또는 이메일로 로그인</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <FormField
          label="이메일"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="daejourneyu@example.com"
          autoComplete="email"
          error={errors.email}
        />
        <FormField
          label="비밀번호"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="8자 이상"
          autoComplete="current-password"
          error={errors.password}
        />

        {formError ? (
          <p className="px-0.5 text-[11px] text-accent-coral">{formError}</p>
        ) : null}

        <Button variant="primary" onClick={handleSubmit} disabled={pending} className="mt-2">
          {pending ? "로그인 중…" : "로그인"}
        </Button>

        <p className="text-center text-[11px] text-ink-muted">
          아직 계정이 없으신가요?{" "}
          <Link
            href={next ? `/onboarding/signup?next=${encodeURIComponent(next)}` : "/onboarding/signup"}
            className="font-bold text-brand-700 underline"
          >
            회원가입
          </Link>
        </p>
      </div>
    </>
  );
}
