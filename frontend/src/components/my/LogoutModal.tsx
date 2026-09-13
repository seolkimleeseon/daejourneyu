"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/useAuthStore";

interface LogoutModalProps {
  open: boolean;
  onClose: () => void;
}

export function LogoutModal({ open, onClose }: LogoutModalProps) {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    // 서버 쿠키까지 지워야 새로고침 후 다시 로그인 상태로 돌아오지 않는다.
    await logout();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} emoji="👋" title="로그아웃 할까요?" description="다시 로그인하면 정보가 그대로 남아있어요">
      <Button
        variant="primary"
        className="bg-accent-coral active:bg-accent-coral"
        onClick={handleLogout}
      >
        로그아웃
      </Button>
      <Button variant="text" onClick={onClose}>
        취소
      </Button>
    </Modal>
  );
}
