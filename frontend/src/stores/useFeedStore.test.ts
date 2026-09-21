import { beforeEach, describe, expect, it } from "vitest";
import { useFeedStore } from "@/stores/useFeedStore";

beforeEach(() => {
  useFeedStore.setState({ overrides: {} });
});

describe("useFeedStore", () => {
  it("게시물 좋아요 토글은 해당 글만 기록하고 다른 글은 건드리지 않는다", () => {
    const { toggleLike } = useFeedStore.getState();

    toggleLike("post-1", true);
    toggleLike("post-2", false);
    toggleLike("post-1", false);

    expect(useFeedStore.getState().overrides).toEqual({
      "post-1": { liked: false },
      "post-2": { liked: false },
    });
  });
});
