import { beforeEach, describe, expect, it } from "vitest";
import { useToastStore } from "@/stores/useToastStore";

beforeEach(() => {
  useToastStore.setState({ message: null, key: 0 });
});

describe("useToastStore", () => {
  it("처음에는 띄울 문구가 없다", () => {
    expect(useToastStore.getState().message).toBeNull();
  });

  it("show로 문구를 띄운다", () => {
    useToastStore.getState().show("저장했어요");

    expect(useToastStore.getState().message).toBe("저장했어요");
  });

  it("같은 문구를 다시 띄워도 key가 올라간다 — 애니메이션이 다시 돌아야 한다", () => {
    useToastStore.getState().show("저장했어요");
    const first = useToastStore.getState().key;

    useToastStore.getState().show("저장했어요");

    expect(useToastStore.getState().key).toBe(first + 1);
  });

  it("hide로 비운다", () => {
    useToastStore.getState().show("저장했어요");

    useToastStore.getState().hide();

    expect(useToastStore.getState().message).toBeNull();
  });

  it("hide는 key를 되돌리지 않는다 — 다음 토스트가 같은 key로 겹치면 안 된다", () => {
    useToastStore.getState().show("저장했어요");
    const key = useToastStore.getState().key;

    useToastStore.getState().hide();

    expect(useToastStore.getState().key).toBe(key);
  });
});
