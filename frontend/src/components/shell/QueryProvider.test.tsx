import { render, screen } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { QueryProvider } from "@/components/shell/QueryProvider";

function Probe() {
  const client = useQueryClient();
  return <div>캐시 연결됨: {String(Boolean(client))}</div>;
}

describe("QueryProvider", () => {
  it("자식을 그대로 그린다", () => {
    render(
      <QueryProvider>
        <div>본문</div>
      </QueryProvider>
    );

    expect(screen.getByText("본문")).toBeTruthy();
  });

  it("자식이 쿼리 캐시를 쓸 수 있게 한다", () => {
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>
    );

    expect(screen.getByText("캐시 연결됨: true")).toBeTruthy();
  });
});
