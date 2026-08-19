"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/onboarding/FormField";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { markOnboardingSeen } from "@/lib/onboarding";
import type { AuthFieldErrors } from "@/lib/api/auth";

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
