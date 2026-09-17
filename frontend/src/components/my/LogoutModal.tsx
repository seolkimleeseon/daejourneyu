"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { clearOnboardingSeen } from "@/lib/onboarding";

interface LogoutModalProps {
  open: boolean;
  onClose: () => void;
}

export function LogoutModal({ open, onClose }: LogoutModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const showToast = useToastStore((state) => state.show);
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    setPending(true);
    // 서버 쿠키까지 지워야 새로고침 후 다시 로그인 상태로 돌아오지 않는다.
    // 반려동물 목록은 AuthHydrator가 로그인 전환을 보고 비운다(usePetStore.clear).
    await logout();

    // 내 후기·내 글처럼 계정에 매인 응답이 캐시에 남아 있으면 다음 계정으로 로그인했을 때
    // 잠깐 남의 데이터가 비친다. 쿠키가 사라진 시점에 같이 버린다.
    queryClient.clear();

    // 다음 진입은 로그인 전 상태이므로 소개 화면부터 다시 보여준다(lib/onboarding 주석 참고).
    clearOnboardingSeen();

    setPending(false);
    onClose();
    showToast("로그아웃했어요");
    // 로그아웃하고도 마이탭에 그대로 머무르면 무엇이 바뀌었는지 보이지 않는다.
    // 히스토리를 남기지 않아야 뒤로가기로 로그인 상태의 화면으로 되돌아가지 않는다.
    router.replace("/onboarding");
  };

  return (
    <Modal open={open} onClose={onClose} emoji="👋" icon3D title="로그아웃 할까요?" description="다시 로그인하면 정보가 그대로 남아있어요">
      <Button
        variant="primary"
        className="bg-accent-coral active:bg-accent-coral"
        onClick={handleLogout}
        disabled={pending}
      >
        {pending ? "로그아웃 중…" : "로그아웃"}
      </Button>
      <Button variant="text" onClick={onClose} disabled={pending}>
        취소
      </Button>
    </Modal>
  );
}
