import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KakaoLoginButton } from "@/components/onboarding/KakaoLoginButton";

describe("KakaoLoginButton", () => {
  it("fetch가 아니라 링크여야 한다 — OAuth는 페이지 이동으로 시작한다", () => {
    render(<KakaoLoginButton />);

    const link = screen.getByRole("link", { name: /카카오로 시작하기/ });
    expect(link.getAttribute("href")).toBe("/api/auth/kakao/start");
  });

  it("돌아갈 경로를 인코딩해 next로 붙인다", () => {
    render(<KakaoLoginButton next="/feed/post/abc?tab=1" />);

    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "/api/auth/kakao/start?next=%2Ffeed%2Fpost%2Fabc%3Ftab%3D1"
    );
  });

  it("next가 없으면(null) 파라미터를 붙이지 않는다", () => {
    render(<KakaoLoginButton next={null} />);

    expect(screen.getByRole("link").getAttribute("href")).toBe("/api/auth/kakao/start");
  });

  it("문구를 바꿔 가입 화면에서도 쓴다", () => {
    render(<KakaoLoginButton label="카카오로 3초 만에 가입" />);

    expect(screen.getByRole("link", { name: /3초 만에 가입/ })).toBeTruthy();
  });
});
