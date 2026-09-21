import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthHydrator } from "@/components/shell/AuthHydrator";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { useToastStore } from "@/stores/useToastStore";
import { stashPendingCourseSave } from "@/lib/pendingCourseSave";
import { makeStop } from "@/test/fixtures";

const hydrateAuth = vi.fn().mockResolvedValue(undefined);
const hydratePets = vi.fn().mockResolvedValue(undefined);
const clearPets = vi.fn();
const addCourse = vi.fn();

/** 로그인 상태 전환을 스토어 쪽에서 일으킨다(실제로는 hydrate/login이 바꾼다). */
function setLoggedIn(isLoggedIn: boolean) {
  act(() => {
    useAuthStore.setState({ isLoggedIn });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  useAuthStore.setState({ isLoggedIn: false, user: null, hydrated: false, hydrate: hydrateAuth });
  usePetStore.setState({ pets: [], hydrated: false, hydrate: hydratePets, clear: clearPets });
  useCourseStore.setState({ addCourse });
  useToastStore.setState({ message: null, key: 0 });
});

describe("AuthHydrator", () => {
  it("아무것도 그리지 않는다 — 부수효과 전용 컴포넌트다", () => {
    const { container } = render(<AuthHydrator />);

    expect(container.innerHTML).toBe("");
  });

  it("마운트되면 세션 복구를 한 번 부른다", () => {
    render(<AuthHydrator />);

    expect(hydrateAuth).toHaveBeenCalledTimes(1);
  });

  it("비로그인으로 시작하면 반려동물 목록을 건드리지 않는다", () => {
    render(<AuthHydrator />);

    expect(hydratePets).not.toHaveBeenCalled();
    // 처음부터 비로그인인 경우까지 clear를 부르면 불필요한 상태 갱신이 된다.
    expect(clearPets).not.toHaveBeenCalled();
  });

  it("로그인 상태로 복구되면 반려동물 목록을 불러온다", () => {
    render(<AuthHydrator />);

    setLoggedIn(true);

    expect(hydratePets).toHaveBeenCalledTimes(1);
  });

  it("로그아웃하면 목록을 비운다 — 다음 계정에 이전 목록이 남으면 안 된다", () => {
    render(<AuthHydrator />);
    setLoggedIn(true);

    setLoggedIn(false);

    expect(clearPets).toHaveBeenCalledTimes(1);
  });

  it("계정을 바꿔 다시 로그인하면 목록을 다시 불러온다", () => {
    render(<AuthHydrator />);
    setLoggedIn(true);
    setLoggedIn(false);

    setLoggedIn(true);

    expect(hydratePets).toHaveBeenCalledTimes(2);
  });

  it("이미 로그인 상태에서 다른 값이 바뀌어도 목록을 다시 부르지 않는다", () => {
    render(<AuthHydrator />);
    setLoggedIn(true);

    act(() => {
      useAuthStore.setState({ hydrated: true });
    });

    expect(hydratePets).toHaveBeenCalledTimes(1);
  });
});

describe("로그인 게이트에 걸려 미뤄둔 코스 저장", () => {
  const pendingCourse = {
    label: "미뤄둔 코스",
    nights: 0,
    transport: "자차" as const,
    source: "manual" as const,
    shared: false,
    days: [[makeStop()]],
  };

  it("로그인되면 맡겨둔 코스를 대신 저장하고 알린다", () => {
    stashPendingCourseSave(pendingCourse);
    render(<AuthHydrator />);

    setLoggedIn(true);

    // 로그인 전에 만든 코스라 반려동물은 비워서 저장한다(지금 활성 반려동물로 오해해 붙이지 않게).
    expect(addCourse).toHaveBeenCalledWith({ ...pendingCourse, petId: null });
    expect(useToastStore.getState().message).toBe("로그인 후 이어서 보관함에 저장했어요 🐾");
  });

  it("한 번 저장하면 다시 로그인해도 또 저장하지 않는다", () => {
    stashPendingCourseSave(pendingCourse);
    render(<AuthHydrator />);
    setLoggedIn(true);
    setLoggedIn(false);

    setLoggedIn(true);

    expect(addCourse).toHaveBeenCalledTimes(1);
  });

  it("맡겨둔 게 없으면 아무것도 하지 않는다", () => {
    render(<AuthHydrator />);

    setLoggedIn(true);

    expect(addCourse).not.toHaveBeenCalled();
  });
});
