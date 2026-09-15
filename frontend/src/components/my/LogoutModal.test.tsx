import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogoutModal } from "@/components/my/LogoutModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { createQueryWrapper, createTestQueryClient } from "@/test/query";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn() }),
}));

const logout = vi.fn();
const STORAGE_KEY = "daejourneyu:onboarded";

function renderModal(onClose: () => void) {
  return render(<LogoutModal open onClose={onClose} />, {
    wrapper: createQueryWrapper(createTestQueryClient()),
  });
}

beforeEach(() => {
  logout.mockReset();
  replace.mockReset();
  useAuthStore.setState({ logout });
  useToastStore.setState({ message: null, key: 0 });
  window.localStorage.setItem(STORAGE_KEY, "1");
});

describe("LogoutModal", () => {
  it("로그아웃을 누르면 서버 로그아웃이 끝난 뒤 닫는다", async () => {
    let finishLogout: () => void = () => {};
    logout.mockImplementation(() => new Promise<void>((resolve) => (finishLogout = resolve)));
    const onClose = vi.fn();
    renderModal(onClose);

    await userEvent.setup().click(screen.getByRole("button", { name: "로그아웃" }));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    finishLogout();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("로그아웃 뒤에는 온보딩 기록을 지우고 온보딩 화면으로 보낸다", async () => {
    logout.mockResolvedValue(undefined);
    renderModal(vi.fn());

    await userEvent.setup().click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/onboarding"));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(useToastStore.getState().message).toBe("로그아웃했어요");
  });

  it("취소는 로그아웃하지 않고 닫기만 한다", async () => {
    const onClose = vi.fn();
    renderModal(onClose);

    await userEvent.setup().click(screen.getByRole("button", { name: "취소" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
  });
});
