import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSheetStore } from "@/stores/useSheetStore";
import { makePlace } from "@/test/fixtures";

const 수목원 = makePlace({ id: "p1", name: "한밭수목원" });
const 장태산 = makePlace({ id: "p2", name: "장태산자연휴양림" });

beforeEach(() => {
  useSheetStore.setState({ isOpen: false, title: "", selected: [], onDone: null });
});

describe("open", () => {
  it("제목과 이미 고른 장소를 들고 열린다", () => {
    useSheetStore.getState().open({ title: "1일차 장소", initialSelected: [수목원] });

    expect(useSheetStore.getState()).toMatchObject({
      isOpen: true,
      title: "1일차 장소",
      selected: [수목원],
    });
  });

  it("다시 열면 앞선 선택을 이어받지 않는다 — 화면마다 별개 세션이다", () => {
    useSheetStore.getState().open({ title: "1일차", initialSelected: [수목원] });
    useSheetStore.getState().open({ title: "2일차", initialSelected: [] });

    expect(useSheetStore.getState().selected).toEqual([]);
    expect(useSheetStore.getState().title).toBe("2일차");
  });

  it("onDone을 안 주면 null로 둔다", () => {
    useSheetStore.getState().open({ title: "장소", initialSelected: [] });

    expect(useSheetStore.getState().onDone).toBeNull();
  });
});

describe("toggle", () => {
  it("없던 장소는 담는다", () => {
    useSheetStore.getState().open({ title: "장소", initialSelected: [] });

    useSheetStore.getState().toggle(수목원);

    expect(useSheetStore.getState().selected).toEqual([수목원]);
  });

  it("이미 담긴 장소는 뺀다", () => {
    useSheetStore.getState().open({ title: "장소", initialSelected: [수목원, 장태산] });

    useSheetStore.getState().toggle(수목원);

    expect(useSheetStore.getState().selected).toEqual([장태산]);
  });

  it("고른 순서를 유지한다 — 동선 순서가 된다", () => {
    useSheetStore.getState().open({ title: "장소", initialSelected: [] });

    useSheetStore.getState().toggle(장태산);
    useSheetStore.getState().toggle(수목원);

    expect(useSheetStore.getState().selected.map((place) => place.id)).toEqual(["p2", "p1"]);
  });

  it("id가 같으면 같은 장소로 본다 — 같은 곳이 두 번 담기면 안 된다", () => {
    useSheetStore.getState().open({ title: "장소", initialSelected: [수목원] });

    useSheetStore.getState().toggle({ ...수목원, name: "한밭 수목원(같은 곳)" });

    expect(useSheetStore.getState().selected).toEqual([]);
  });
});

describe("close", () => {
  it("고른 목록을 콜백에 넘기고 닫는다", () => {
    const onDone = vi.fn();
    useSheetStore.getState().open({ title: "장소", initialSelected: [수목원], onDone });

    useSheetStore.getState().toggle(장태산);
    useSheetStore.getState().close();

    expect(onDone).toHaveBeenCalledWith([수목원, 장태산]);
    expect(useSheetStore.getState().isOpen).toBe(false);
  });

  it("콜백이 없어도 그냥 닫힌다", () => {
    useSheetStore.getState().open({ title: "장소", initialSelected: [] });

    expect(() => useSheetStore.getState().close()).not.toThrow();
    expect(useSheetStore.getState().isOpen).toBe(false);
  });

  it("닫으면 콜백을 비운다 — 다음 세션에 남은 콜백이 불리면 안 된다", () => {
    const onDone = vi.fn();
    useSheetStore.getState().open({ title: "장소", initialSelected: [], onDone });
    useSheetStore.getState().close();

    useSheetStore.getState().close();

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
