"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/onboarding/FormField";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";

interface SignupErrors {
  email?: string;
  nickname?: string;
  password?: string;
}

/**
 * signup — 회원가입 폼.
 * TODO(api): POST /api/auth/signup 으로 교체. 지금은 입력값을 검증만 하고 목 세션(useAuthStore.login)을 연다.
 */
export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const showToast = useToastStore((state) => state.show);

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<SignupErrors>({});

  const handleSubmit = () => {
    const next: SignupErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "이메일 형식을 확인해주세요";
    if (nickname.trim().length < 2) next.nickname = "닉네임은 2자 이상 입력해주세요";
    if (password.length < 8) next.password = "비밀번호는 8자 이상 입력해주세요";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    login();
    showToast("가입이 완료됐어요. 반려동물을 등록해볼까요?");
    router.replace("/onboarding/pet-register");
  };

  return (
    <>
      <TopBar title="회원가입" showBack />
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
          onChange={(event) => setPassword(event.target.value)}
          placeholder="8자 이상"
          autoComplete="new-password"
          error={errors.password}
        />

        <Button variant="primary" onClick={handleSubmit} className="mt-2">
          가입하고 시작하기
        </Button>
        <p className="px-1 text-center text-[10px] text-ink-muted">
          가입하면 대저니유 이용약관과 개인정보 처리방침에 동의하게 돼요.
        </p>
      </div>
    </>
  );
}
