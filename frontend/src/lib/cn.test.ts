import { describe, expect, it } from "vitest";
import { cn } from "./cn";

/*
 * clsx만 쓰면 "bg-brand bg-card"가 그대로 남아 어느 쪽이 이길지 CSS 순서에 달리게 된다.
 * 뒤에 온 클래스가 이기는 이 규칙 위에 Tag의 active, CourseButton의 variant 덮어쓰기가
 * 얹혀 있어서, 이 계약이 깨지면 화면 여러 곳의 색이 한꺼번에 어긋난다.
 */
describe("cn", () => {
  it("같은 갈래끼리 부딪히면 뒤에 온 것만 남긴다", () => {
    expect(cn("bg-brand", "bg-card")).toBe("bg-card");
  });

  it("갈래가 다르면 둘 다 남긴다", () => {
    expect(cn("bg-brand", "text-white")).toBe("bg-brand text-white");
  });

  it("조건이 거짓인 클래스는 빼고 이어 붙인다 — active && \"...\" 패턴을 그대로 쓴다", () => {
    expect(cn("rounded-full", false && "bg-brand", undefined, "text-xs")).toBe("rounded-full text-xs");
  });

  it("덮어쓸 게 없으면 받은 그대로 둔다", () => {
    expect(cn(undefined, null, "")).toBe("");
  });
});
