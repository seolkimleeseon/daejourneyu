import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";
import { hasSeenOnboarding } from "@/lib/onboarding";
import { makePet } from "@/test/fixtures";
import PetRegisterPage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
const params = vi.hoisted(() => ({ current: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  useSearchParams: () => params.current,
}));

/** 폼 내부는 PetRegisterForm.test.tsx가 본다 — 여기서는 어떤 mode로 넘기는지와 완료 후 이동만 본다. */
const form = vi.hoisted(() => ({ spy: vi.fn() }));
vi.mock("@/components/onboarding/PetRegisterForm", () => ({
  PetRegisterForm: (props: { mode: string; petId?: string; onCompleted: () => void }) => {
    form.spy(props);
    return (
      <button type="button" onClick={props.onCompleted}>
        저장 완료(테스트)
      </button>
    );
  },
}));

function setParams(query: string) {
  params.current = new URLSearchParams(query);
}

beforeEach(() => {
  vi.clearAllMocks();
  setParams("");
  window.localStorage.clear();
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: null });
  usePetStore.setState({ pets: [makePet()], hydrated: true });
});

describe("로그인 게이팅", () => {
  it("세션 복구 전에는 게이팅을 띄우지 않는다 — 정상 사용자까지 막힌다", () => {
    useAuthStore.setState({ isLoggedIn: false, hydrated: false });
    render(<PetRegisterPage />);

    expect(screen.queryByText("로그인이 필요해요")).toBeNull();
    expect(form.spy).toHaveBeenCalled();
  });

  it("비로그인이면 폼 대신 로그인을 안내한다", () => {
    useAuthStore.setState({ isLoggedIn: false, hydrated: true });
    render(<PetRegisterPage />);

    expect(screen.getByText("로그인이 필요해요")).toBeTruthy();
    expect(form.spy).not.toHaveBeenCalled();
  });

  it("로그인·가입 뒤 이 화면으로 되돌아오도록 next를 붙인다", async () => {
    useAuthStore.setState({ isLoggedIn: false, hydrated: true });
    setParams("mode=edit&petId=pet-1");
    const user = userEvent.setup();
    render(<PetRegisterPage />);

    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(nav.push).toHaveBeenCalledWith(
      "/onboarding/login?next=%2Fonboarding%2Fpet-register%3Fmode%3Dedit%26petId%3Dpet-1"
    );
  });

  it("나중에 등록하기로 빠지면 온보딩을 끝난 것으로 본다", async () => {
    useAuthStore.setState({ isLoggedIn: false, hydrated: true });
    const user = userEvent.setup();
    render(<PetRegisterPage />);

    await user.click(screen.getByRole("button", { name: "나중에 등록할게요" }));

    expect(hasSeenOnboarding()).toBe(true);
    expect(nav.replace).toHaveBeenCalledWith("/home");
  });
});

describe("등록(온보딩 흐름)", () => {
  it("create 모드로 폼을 띄우고 안내 문구를 붙인다", () => {
    render(<PetRegisterPage />);

    expect(form.spy).toHaveBeenCalledWith(expect.objectContaining({ mode: "create" }));
    expect(screen.getByText(/등록해두면 맞는 장소만/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "나중에 등록할게요" })).toBeTruthy();
  });

  it("저장을 마치면 온보딩 완료를 기록하고 홈으로 보낸다", async () => {
    const user = userEvent.setup();
    render(<PetRegisterPage />);

    await user.click(screen.getByRole("button", { name: "저장 완료(테스트)" }));

    expect(hasSeenOnboarding()).toBe(true);
    expect(nav.replace).toHaveBeenCalledWith("/home");
    expect(nav.back).not.toHaveBeenCalled();
  });
});

describe("수정 · 마이탭에서 들어온 경우", () => {
  it("mode=edit이면 petId와 함께 수정 폼으로 넘긴다", () => {
    setParams("mode=edit&petId=pet-1&from=my");
    render(<PetRegisterPage />);

    expect(form.spy).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "edit", petId: "pet-1" })
    );
    expect(screen.getByText("반려동물 정보 수정")).toBeTruthy();
  });

  it("수정을 마치면 홈이 아니라 왔던 화면으로 돌아간다", async () => {
    setParams("mode=edit&petId=pet-1&from=my");
    const user = userEvent.setup();
    render(<PetRegisterPage />);

    await user.click(screen.getByRole("button", { name: "저장 완료(테스트)" }));

    expect(nav.back).toHaveBeenCalled();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("마이탭에서 추가로 들어오면 등록이어도 왔던 화면으로 돌아간다", async () => {
    setParams("from=my");
    const user = userEvent.setup();
    render(<PetRegisterPage />);

    expect(form.spy).toHaveBeenCalledWith(expect.objectContaining({ mode: "create" }));
    // 온보딩 흐름이 아니므로 건너뛰기 버튼도 없다.
    expect(screen.queryByRole("button", { name: "나중에 등록할게요" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "저장 완료(테스트)" }));
    expect(nav.back).toHaveBeenCalled();
  });

  it("mode 값이 이상하면 등록으로 본다", () => {
    setParams("mode=이상한값");
    render(<PetRegisterPage />);

    expect(form.spy).toHaveBeenCalledWith(expect.objectContaining({ mode: "create" }));
  });
});
