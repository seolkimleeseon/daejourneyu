import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogoutModal } from "@/components/my/LogoutModal";
import { useAuthStore } from "@/stores/useAuthStore";

const logout = vi.fn();

beforeEach(() => {
  logout.mockReset();
  useAuthStore.setState({ logout });
});

describe("LogoutModal", () => {
  it("로그아웃을 누르면 서버 로그아웃이 끝난 뒤 닫는다", async () => {
    let finishLogout: () => void = () => {};
    logout.mockImplementation(() => new Promise<void>((resolve) => (finishLogout = resolve)));
    const onClose = vi.fn();
    render(<LogoutModal open onClose={onClose} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "로그아웃" }));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    finishLogout();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("취소는 로그아웃하지 않고 닫기만 한다", async () => {
    const onClose = vi.fn();
    render(<LogoutModal open onClose={onClose} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "취소" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
  });
});
