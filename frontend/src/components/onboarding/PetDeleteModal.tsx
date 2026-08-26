"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { usePetStore } from "@/stores/usePetStore";
import { useToastStore } from "@/stores/useToastStore";

interface PetDeleteModalProps {
  open: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
  /** 삭제가 끝난 뒤 화면을 벗어나는 처리 — 등록 폼과 같은 콜백을 쓴다. */
  onDeleted: () => void;
}

/**
 * 반려동물 삭제 확인. 되돌릴 수 없는 동작이라 폼에서 바로 지우지 않고 한 단계를 둔다
 * (마이탭 로그아웃과 같은 패턴).
 */
export function PetDeleteModal({ open, onClose, petId, petName, onDeleted }: PetDeleteModalProps) {
  const removePet = usePetStore((state) => state.removePet);
  const showToast = useToastStore((state) => state.show);
  const [pending, setPending] = useState(false);

  const handleDelete = async () => {
    setPending(true);
    const result = await removePet(petId);
    setPending(false);

    if (!result.ok) {
      // 모달은 닫고 실패만 알린다 — 열어둔 채로 두면 같은 버튼을 계속 누르게 된다.
      onClose();
      showToast(result.message);
      return;
    }

    onClose();
    showToast(`${petName}의 정보를 삭제했어요`);
    onDeleted();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      emoji="🥲"
      title={`${petName}을(를) 삭제할까요?`}
      description="등록한 정보와 여행 유형이 함께 사라지고, 되돌릴 수 없어요"
    >
      <Button
        variant="primary"
        className="bg-accent-coral active:bg-accent-coral"
        onClick={handleDelete}
        disabled={pending}
      >
        {pending ? "삭제 중…" : "삭제"}
      </Button>
      <Button variant="text" onClick={onClose} disabled={pending}>
        취소
      </Button>
    </Modal>
  );
}
