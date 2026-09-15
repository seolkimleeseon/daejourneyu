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
import type { AuthFieldErrors } from "@/lib/api/auth";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-xs text-ink-muted">불러오는 중…</div>}>
      <SignupPageInner />
    </Suspense>
  );
}

/** signup — 회원가입 폼. 검증은 서버(POST /api/auth/signup)가 정본이고 여기서는 결과만 표시한다. */
function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const signup = useAuthStore((state) => state.signup);
  const showToast = useToastStore((state) => state.show);

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  /** 서버가 모르는 필드(재확인)라 AuthFieldErrors와 따로 둔다. */
  const [passwordConfirmError, setPasswordConfirmError] = useState<string | undefined>();
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async () => {
    // 재확인은 서버로 보내지 않는 값이라 여기서만 본다 — 통과하기 전에는 가입 요청 자체를 막는다.
    if (password !== passwordConfirm) {
      setPasswordConfirmError("비밀번호가 일치하지 않아요");
      return;
    }

    setPending(true);
    setFormError(null);
    setErrors({});
    setPasswordConfirmError(undefined);

    const result = await signup({ email: email.trim(), nickname: nickname.trim(), password });
    setPending(false);

    if (!result.ok) {
      setErrors(result.errors ?? {});
      setFormError(result.errors ? null : result.message ?? "가입에 실패했어요");
      return;
    }

    // 가입 직후에는 반려동물 등록으로 이어간다. 게이팅에 걸려 들어온 경우에는 원래 화면으로 돌려보낸다.
    if (next) {
      showToast(`${result.user.nickname}님, 반가워요!`);
      router.replace(next);
      return;
    }

    showToast("가입이 완료됐어요. 반려동물을 등록해볼까요?");
    router.replace("/onboarding/pet-register");
  };

  return (
    <>
      <TopBar title="회원가입" showBack />
      <div className="flex flex-col gap-3.5 px-5 pb-8 pt-4">
        <KakaoLoginButton next={next} label="카카오로 시작하기" />

        <div className="flex items-center gap-2 py-1">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[10px] text-ink-muted">또는 이메일로 가입</span>
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
          label="닉네임"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="콩이맘"
          maxLength={20}
          error={errors.nickname}
        />
        <FormField
          label="비밀번호"
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            // 비밀번호를 고치는 순간 기존 불일치 안내는 낡은 정보가 된다.
            setPasswordConfirmError(undefined);
          }}
          placeholder="8자 이상"
          autoComplete="new-password"
          error={errors.password}
        />
        <FormField
          label="비밀번호 확인"
          type="password"
          value={passwordConfirm}
          onChange={(event) => {
            setPasswordConfirm(event.target.value);
            setPasswordConfirmError(undefined);
          }}
          placeholder="비밀번호를 한 번 더 입력해주세요"
          autoComplete="new-password"
          error={passwordConfirmError}
        />

        {formError ? <p className="px-0.5 text-[11px] text-accent-coral">{formError}</p> : null}

        <Button variant="primary" onClick={handleSubmit} disabled={pending} className="mt-2">
          {pending ? "가입 중…" : "가입하고 시작하기"}
        </Button>

        <p className="px-1 text-center text-[10px] text-ink-muted">
          가입하면 대저니유 이용약관과 개인정보 처리방침에 동의하게 돼요.
        </p>
        <p className="text-center text-[11px] text-ink-muted">
          이미 계정이 있으신가요?{" "}
          <Link
            href={next ? `/onboarding/login?next=${encodeURIComponent(next)}` : "/onboarding/login"}
            className="font-bold text-brand-700 underline"
          >
            로그인
          </Link>
        </p>
      </div>
    </>
  );
}
