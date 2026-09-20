"use client";

import { usePathname, useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  /** 로그인 화면에서 돌아온 뒤 호출부가 이어갈 동작을 표현한다. 현재는 next 경로 복귀로 대체된다. */
  onLoggedIn?: () => void;
  /**
   * 로그인 성공 후 돌아갈 경로. 안 넘기면 현재 경로(pathname)로 되돌아온다.
   * 호출부가 로그인 직후 이어갈 동작(예: 후기 작성 화면으로 바로 이동)이 있으면, 그 동작을
   * onLoggedIn 콜백으로 표현하는 대신(이 모달은 실제 로그인 전에 페이지를 떠나므로 콜백을
   * 다시 부를 수 없다) 그 목적지 경로를 여기로 직접 넘긴다.
   */
  redirectTo?: string;
}

/**
 * 로그인 게이트. 실제 인증은 /onboarding/login 화면이 담당하고 이 모달은 그리로 보내기만 한다.
 * 로그인 후 원래 보려던 화면(또는 redirectTo로 지정한 목적지)으로 돌아오도록 next로 넘긴다.
 */
export function LoginModal({ open, onClose, redirectTo }: LoginModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  const go = (path: string) => {
    onClose();
    const next = redirectTo ?? pathname ?? "/home";
    router.push(`${path}?next=${encodeURIComponent(next)}`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      emoji="🐾"
      icon3D
      title="로그인이 필요해요"
      description="로그인하면 반려동물 여권과 내 활동을 볼 수 있어요."
      widthClass="w-[300px]"
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
