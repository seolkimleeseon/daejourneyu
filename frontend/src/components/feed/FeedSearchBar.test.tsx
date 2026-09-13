import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FeedSearchBar } from "@/components/feed/FeedSearchBar";

/** 입력값은 부모가 들고 있는 컴포넌트라, 실제 페이지처럼 상태를 쥔 채로 렌더링한다. */
function Harness({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [value, setValue] = useState("");
  return <FeedSearchBar value={value} onChange={setValue} onSubmit={onSubmit} />;
}

describe("FeedSearchBar", () => {
  it("타이핑만으로는 검색하지 않고 엔터를 쳐야 검색한다", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const input = screen.getByRole("searchbox", { name: "장소로 코스 검색" });

    await user.type(input, "한빛탑");
    expect(onSubmit).not.toHaveBeenCalled();

    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("한빛탑");
  });

  it("입력을 비우면 엔터 없이 바로 검색을 해제한다", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const input = screen.getByRole("searchbox", { name: "장소로 코스 검색" });

    await user.type(input, "갑천");
    await user.clear(input);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("");
  });
});
