"use client";

import { usePathname, useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  /** 로그인 화면에서 돌아온 뒤 호출부가 이어갈 동작을 표현한다. 현재는 next 경로 복귀로 대체된다. */
  onLoggedIn?: () => void;
}

/**
 * 로그인 게이트. 실제 인증은 /onboarding/login 화면이 담당하고 이 모달은 그리로 보내기만 한다.
 * 로그인 후 원래 보려던 화면으로 돌아오도록 현재 경로를 next로 넘긴다.
 */
export function LoginModal({ open, onClose }: LoginModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  const go = (path: string) => {
    onClose();
    router.push(`${path}?next=${encodeURIComponent(pathname ?? "/home")}`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      emoji="🐾"
      title="로그인이 필요해요"
      description="로그인하면 반려동물 여권과 내 활동을 볼 수 있어요."
    >
      <Button variant="primary" onClick={() => go("/onboarding/login")}>
        로그인
      </Button>
      <Button variant="secondary" onClick={() => go("/onboarding/signup")}>
        회원가입
      </Button>
      <Button variant="text" onClick={onClose}>
        닫기
      </Button>
    </Modal>
  );
}
