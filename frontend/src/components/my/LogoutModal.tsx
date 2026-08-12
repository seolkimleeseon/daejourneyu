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

  const handleLogout = () => {
    logout();
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
