import { afterEach, describe, expect, it, vi } from "vitest";
import { hasSeenOnboarding, markOnboardingSeen } from "@/lib/onboarding";

/** node 환경에는 window가 없으므로 localStorage만 흉내 낸 가짜 window를 주입한다. */
function stubLocalStorage(storage: Pick<Storage, "getItem" | "setItem">) {
  vi.stubGlobal("window", { localStorage: storage });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("온보딩 완료 기록", () => {
  it("서버 렌더링(window 없음)에서는 온보딩을 이미 본 것으로 취급한다", () => {
    expect(hasSeenOnboarding()).toBe(true);
  });

  it("처음엔 false, 완료 기록 후엔 true를 돌려준다", () => {
    const store = new Map<string, string>();
    stubLocalStorage({
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    });

    expect(hasSeenOnboarding()).toBe(false);
    markOnboardingSeen();
    expect(hasSeenOnboarding()).toBe(true);
  });

  it("localStorage 접근이 막힌 환경에서도 예외 없이 온보딩을 반복해 띄우지 않는다", () => {
    const blocked = () => {
      throw new Error("SecurityError");
    };
    stubLocalStorage({ getItem: blocked, setItem: blocked });

    expect(() => markOnboardingSeen()).not.toThrow();
    expect(hasSeenOnboarding()).toBe(true);
  });
});
