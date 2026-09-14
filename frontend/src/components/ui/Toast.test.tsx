import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastViewport } from "@/components/ui/Toast";
import { useToastStore } from "@/stores/useToastStore";

const AUTO_HIDE_MS = 2200;

function toast(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

beforeEach(() => {
  vi.useFakeTimers();
  useToastStore.setState({ message: null, key: 0 });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ToastViewport", () => {
  it("띄울 문구가 없으면 보이지 않는다", () => {
    const { container } = render(<ToastViewport />);

    expect(toast(container).className).toContain("opacity-0");
  });

  it("스토어에 문구가 들어오면 띄운다", () => {
    const { container } = render(<ToastViewport />);

    act(() => useToastStore.getState().show("후기를 삭제했어요"));

    expect(toast(container).textContent).toBe("후기를 삭제했어요");
    expect(toast(container).className).toContain("opacity-100");
  });

  it("잠시 뒤 저절로 사라진다", () => {
    const { container } = render(<ToastViewport />);
    act(() => useToastStore.getState().show("저장했어요"));

    act(() => vi.advanceTimersByTime(AUTO_HIDE_MS - 1));
    expect(toast(container).className).toContain("opacity-100");

    act(() => vi.advanceTimersByTime(1));
    expect(toast(container).className).toContain("opacity-0");
    expect(useToastStore.getState().message).toBeNull();
  });

  it("같은 문구를 다시 띄우면 사라질 시간도 다시 센다", () => {
    const { container } = render(<ToastViewport />);
    act(() => useToastStore.getState().show("저장했어요"));

    act(() => vi.advanceTimersByTime(AUTO_HIDE_MS - 200));
    // 같은 문구라도 key가 올라가므로 타이머가 새로 걸려야 한다.
    act(() => useToastStore.getState().show("저장했어요"));
    act(() => vi.advanceTimersByTime(300));

    expect(toast(container).className).toContain("opacity-100");

    act(() => vi.advanceTimersByTime(AUTO_HIDE_MS));
    expect(toast(container).className).toContain("opacity-0");
  });

  it("언마운트되면 타이머를 정리한다", () => {
    const { unmount } = render(<ToastViewport />);
    act(() => useToastStore.getState().show("저장했어요"));

    unmount();
    act(() => vi.advanceTimersByTime(AUTO_HIDE_MS * 2));

    // 화면이 사라진 뒤 hide가 돌아 다른 화면의 토스트를 지우는 일이 없어야 한다.
    expect(useToastStore.getState().message).toBe("저장했어요");
  });
});
