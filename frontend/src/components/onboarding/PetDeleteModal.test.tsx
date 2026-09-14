import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PetDeleteModal } from "@/components/onboarding/PetDeleteModal";
import { usePetStore } from "@/stores/usePetStore";
import { useToastStore } from "@/stores/useToastStore";

const removePet = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  usePetStore.setState({ removePet });
  useToastStore.setState({ message: null });
});

function setup(props: Partial<React.ComponentProps<typeof PetDeleteModal>> = {}) {
  const onClose = vi.fn();
  const onDeleted = vi.fn();
  render(
    <PetDeleteModal
      open
      onClose={onClose}
      petId="pet-1"
      petName="콩이"
      onDeleted={onDeleted}
      {...props}
    />
  );
  return { onClose, onDeleted, user: userEvent.setup() };
}

describe("PetDeleteModal", () => {
  it("되돌릴 수 없다는 걸 이름과 함께 알린다", () => {
    setup();

    expect(screen.getByText("콩이을(를) 삭제할까요?")).toBeTruthy();
    expect(screen.getByText(/되돌릴 수 없어요/)).toBeTruthy();
  });

  it("취소하면 닫기만 하고 지우지 않는다", async () => {
    const { user, onClose, onDeleted } = setup();

    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(onClose).toHaveBeenCalled();
    expect(removePet).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("삭제에 성공하면 닫고 토스트를 띄운 뒤 화면을 벗어난다", async () => {
    removePet.mockResolvedValue({ ok: true });
    const { user, onClose, onDeleted } = setup();

    await user.click(screen.getByRole("button", { name: "삭제" }));

    expect(removePet).toHaveBeenCalledWith("pet-1");
    expect(onClose).toHaveBeenCalled();
    expect(useToastStore.getState().message).toBe("콩이의 정보를 삭제했어요");
    expect(onDeleted).toHaveBeenCalled();
  });

  it("실패하면 모달을 닫고 사유만 알린다 — 열어두면 같은 버튼을 계속 누르게 된다", async () => {
    removePet.mockResolvedValue({ ok: false, message: "서버에 연결할 수 없어요" });
    const { user, onClose, onDeleted } = setup();

    await user.click(screen.getByRole("button", { name: "삭제" }));

    expect(onClose).toHaveBeenCalled();
    expect(useToastStore.getState().message).toBe("서버에 연결할 수 없어요");
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("삭제 중에는 두 버튼을 모두 잠근다", async () => {
    let finish: (value: unknown) => void = () => {};
    removePet.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "삭제" }));

    expect(screen.getByRole("button", { name: "삭제 중…" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "취소" }).hasAttribute("disabled")).toBe(true);

    finish({ ok: true });
  });
});
