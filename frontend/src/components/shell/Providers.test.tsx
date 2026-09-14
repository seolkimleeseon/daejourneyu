import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/components/shell/Providers";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";
import { useToastStore } from "@/stores/useToastStore";

const hydrateAuth = vi.fn().mockResolvedValue(undefined);
const hydratePets = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  useAuthStore.setState({ isLoggedIn: false, user: null, hydrated: false, hydrate: hydrateAuth });
  usePetStore.setState({ pets: [], hydrated: false, hydrate: hydratePets, clear: vi.fn() });
  useToastStore.setState({ message: null, key: 0 });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Providers", () => {
  it("앱 전체에 필요한 것들을 한 번에 올린다", () => {
    render(
      <Providers>
        <div>앱 본문</div>
      </Providers>
    );

    expect(screen.getByText("앱 본문")).toBeTruthy();
    // 스플래시는 루트에 한 번만 마운트된다 — 탭 이동으로 다시 뜨면 안 되는 이유다.
    expect(screen.getByText("DAEJEON · JOURNEY · YOU")).toBeTruthy();
    expect(hydrateAuth).toHaveBeenCalledTimes(1);
  });

  it("토스트 자리도 함께 올려 어느 화면에서든 띄울 수 있게 한다", () => {
    render(
      <Providers>
        <div>앱 본문</div>
      </Providers>
    );

    act(() => useToastStore.getState().show("저장했어요"));

    expect(screen.getByText("저장했어요")).toBeTruthy();
  });
});
