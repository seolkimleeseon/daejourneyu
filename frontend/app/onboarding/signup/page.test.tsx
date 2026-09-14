import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { makeUser } from "@/test/fixtures";
import SignupPage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
const params = vi.hoisted(() => ({ current: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  useSearchParams: () => params.current,
}));

const signup = vi.fn();
const user = makeUser({ nickname: "콩이맘" });

beforeEach(() => {
  vi.clearAllMocks();
  params.current = new URLSearchParams();
  useAuthStore.setState({ isLoggedIn: false, user: null, hydrated: true, signup });
  useToastStore.setState({ message: null });
});

async function submit() {
  const actor = userEvent.setup();
  await actor.type(screen.getByLabelText("이메일"), " kong@example.com ");
  await actor.type(screen.getByLabelText("닉네임"), " 콩이맘 ");
  await actor.type(screen.getByLabelText("비밀번호"), "pw12345678");
  await actor.click(screen.getByRole("button", { name: "가입하고 시작하기" }));
}

describe("회원가입", () => {
  it("이메일·닉네임의 앞뒤 공백을 잘라 보낸다", async () => {
    signup.mockResolvedValue({ ok: true, user });
    render(<SignupPage />);

    await submit();

    expect(signup).toHaveBeenCalledWith({
      email: "kong@example.com",
      nickname: "콩이맘",
      password: "pw12345678",
    });
  });

  it("가입 직후에는 반려동물 등록으로 이어간다", async () => {
    signup.mockResolvedValue({ ok: true, user });
    render(<SignupPage />);

    await submit();

    expect(nav.replace).toHaveBeenCalledWith("/onboarding/pet-register");
    expect(useToastStore.getState().message).toContain("반려동물을 등록");
  });

  it("게이팅에 걸려 왔으면 등록을 건너뛰고 원래 화면으로 돌려보낸다", async () => {
    params.current = new URLSearchParams("next=/schedule");
    signup.mockResolvedValue({ ok: true, user });
    render(<SignupPage />);

    await submit();

    expect(nav.replace).toHaveBeenCalledWith("/schedule");
    expect(useToastStore.getState().message).toBe("콩이맘님, 반가워요!");
  });

  it("필드별 오류를 각 입력 아래에 붙인다", async () => {
    signup.mockResolvedValue({
      ok: false,
      errors: { email: "이메일 형식을 확인해주세요", password: "비밀번호는 8자 이상 입력해주세요" },
    });
    render(<SignupPage />);

    await submit();

    expect(screen.getByText("이메일 형식을 확인해주세요")).toBeTruthy();
    expect(screen.getByText("비밀번호는 8자 이상 입력해주세요")).toBeTruthy();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("이미 가입된 이메일 같은 메시지만 오면 폼 아래에 띄운다", async () => {
    signup.mockResolvedValue({ ok: false, message: "서버에 연결할 수 없어요" });
    render(<SignupPage />);

    await submit();

    expect(screen.getByText("서버에 연결할 수 없어요")).toBeTruthy();
  });

  it("가입 중에는 버튼을 잠가 두 번 보내지 않는다", async () => {
    const actor = userEvent.setup();
    let resolveSignup: (value: unknown) => void = () => {};
    signup.mockReturnValue(new Promise((resolve) => (resolveSignup = resolve)));
    render(<SignupPage />);

    await actor.type(screen.getByLabelText("이메일"), "kong@example.com");
    await actor.type(screen.getByLabelText("닉네임"), "콩이맘");
    await actor.type(screen.getByLabelText("비밀번호"), "pw12345678");
    await actor.click(screen.getByRole("button", { name: "가입하고 시작하기" }));

    const pending = screen.getByRole("button", { name: "가입 중…" });
    expect(pending.hasAttribute("disabled")).toBe(true);

    resolveSignup({ ok: true, user });
  });

  it("로그인 링크와 카카오 버튼에 next를 이어 넘긴다", () => {
    params.current = new URLSearchParams("next=/my");
    render(<SignupPage />);

    expect(screen.getByRole("link", { name: "로그인" }).getAttribute("href")).toBe(
      "/onboarding/login?next=%2Fmy"
    );
    expect(screen.getByRole("link", { name: /카카오/ }).getAttribute("href")).toContain(
      "next=%2Fmy"
    );
  });
});
