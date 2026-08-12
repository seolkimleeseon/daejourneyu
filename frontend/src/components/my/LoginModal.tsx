"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/useAuthStore";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  /** 로그인 성공 후 이어서 진행할 동작 (예: 원래 가려던 화면으로 이동) */
  onLoggedIn?: () => void;
}

// TODO(api): 이메일/비밀번호 입력은 아직 목업이다 — 실제 로그인 폼은 인증 API 붙을 때 함께 구현.
export function LoginModal({ open, onClose, onLoggedIn }: LoginModalProps) {
  const login = useAuthStore((state) => state.login);

  const handleLogin = () => {
    login();
    onClose();
    onLoggedIn?.();
  };

  return (
    <Modal open={open} onClose={onClose} emoji="🐾" title="로그인이 필요해요">
      <Button variant="primary" onClick={handleLogin}>
        로그인 (목업)
      </Button>
      <Button variant="text" onClick={onClose}>
        닫기
      </Button>
    </Modal>
  );
}
