import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { makePlace, makeReview } from "@/test/fixtures";
import PlaceDetailPage from "./page";

const search = vi.hoisted(() => ({ params: new URLSearchParams() }));
const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  usePathname: () => "/place/한밭수목원",
  useSearchParams: () => search.params,
}));

const hooks = vi.hoisted(() => ({ usePlaces: vi.fn(), useReviews: vi.fn() }));
vi.mock("@/hooks/usePlaces", () => ({ usePlaces: hooks.usePlaces }));
vi.mock("@/hooks/useReviews", () => ({ useReviews: hooks.useReviews }));

/** 지도는 카카오 SDK가 있어야 그려진다 — 좌표만 남기고 비운다. */
const map = vi.hoisted(() => ({ render: vi.fn() }));
vi.mock("@/components/place/PlaceMap", () => ({
  PlaceMap: (props: Record<string, unknown>) => {
    map.render(props);
    return <div data-testid="place-map" />;
  },
}));

const 한밭수목원 = makePlace({
  id: "p1",
  name: "한밭수목원",
  district: "서구",
  category: "산책",
  condition: "문화체육관광부 인증 · 전 견종 동반 가능 · 목줄",
  lat: 36.36,
  lng: 127.38,
});

function setup(name = "한밭수목원") {
  const view = render(<PlaceDetailPage params={{ name }} />);
  return { ...view, user: userEvent.setup() };
}

/** 로그인 모달은 닫혀 있어도 DOM에 남는다 — 열림 여부는 오버레이 불투명도로 본다. */
function loginModalOpen(): boolean {
  return screen.getByText("로그인이 필요해요").closest(".fixed")?.className.includes("opacity-100") ?? false;
}

beforeEach(() => {
  vi.clearAllMocks();
  search.params = new URLSearchParams();
  hooks.usePlaces.mockReturnValue({ data: [한밭수목원], isLoading: false });
  hooks.useReviews.mockReturnValue({ data: [], isLoading: false });
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: null });
});

describe("장소를 찾는 동안", () => {
  it("불러오는 중이면 '없는 장소'라고 단정하지 않는다", () => {
    hooks.usePlaces.mockReturnValue({ data: undefined, isLoading: true });
    setup();

    expect(screen.getByText("불러오는 중…")).toBeTruthy();
    expect(screen.queryByText("존재하지 않는 장소예요.")).toBeNull();
  });

  it("다 불러왔는데 없으면 그렇게 말한다", () => {
    setup("없는장소");

    expect(screen.getByText("존재하지 않는 장소예요.")).toBeTruthy();
  });

  it("주소에 인코딩된 이름도 풀어서 찾는다", () => {
    setup(encodeURIComponent("한밭수목원"));

    expect(screen.getByText("🐾 반려동물 동반 가능")).toBeTruthy();
  });
});

describe("장소 정보", () => {
  it("분류와 구를 태그로 단다", () => {
    setup();

    expect(screen.getByText("산책")).toBeTruthy();
    expect(screen.getByText("서구")).toBeTruthy();
  });

  it("소형견만 가능한 곳은 제목 옆 태그로 먼저 짚어준다", () => {
    hooks.usePlaces.mockReturnValue({
      data: [makePlace({ ...한밭수목원, smallDogOnly: true })],
      isLoading: false,
    });
    const { container } = setup();

    // 아래 조건 칩에도 같은 문구가 붙으므로 머리 태그 줄 안에서만 찾는다.
    const tagRow = container.querySelector(".mb-3.flex.flex-wrap") as HTMLElement;
    expect(within(tagRow).getByText("소형견만")).toBeTruthy();
  });

  it("동반 불가인 곳은 가능하다고 하지 않는다", () => {
    hooks.usePlaces.mockReturnValue({
      data: [makePlace({ ...한밭수목원, petFriendly: false })],
      isLoading: false,
    });
    setup();

    expect(screen.getByText("🚫 반려동물 동반 불가")).toBeTruthy();
  });

  it("긴 조건 문구는 칩으로 쪼개고 아래엔 출처만 남긴다", () => {
    setup();

    expect(screen.getByText("전 견종 가능")).toBeTruthy();
    expect(screen.getByText("목줄 필수")).toBeTruthy();
    expect(screen.getByText("문화체육관광부 인증")).toBeTruthy();
  });

  it("쪼갤 키워드가 없으면 원문을 그대로 보여준다 — 빈 줄로 두지 않는다", () => {
    hooks.usePlaces.mockReturnValue({
      data: [makePlace({ ...한밭수목원, condition: "대전시 공공데이터" })],
      isLoading: false,
    });
    setup();

    expect(screen.getByText("대전시 공공데이터")).toBeTruthy();
  });

  it("지도에 그 장소의 좌표를 꽂는다", () => {
    setup();

    expect(map.render).toHaveBeenLastCalledWith({ name: "한밭수목원", lat: 36.36, lng: 127.38 });
  });
});

describe("후기", () => {
  it("그 장소의 후기만 불러온다", () => {
    setup();

    expect(hooks.useReviews).toHaveBeenLastCalledWith("p1", { enabled: true });
  });

  it("장소를 아직 못 찾았으면 후기를 요청하지 않는다 — 전체 후기가 뜨는 걸 막는다", () => {
    hooks.usePlaces.mockReturnValue({ data: undefined, isLoading: true });

    setup();

    expect(hooks.useReviews).toHaveBeenLastCalledWith(undefined, { enabled: false });
  });

  it("아직 없으면 첫 후기를 남겨보라고 한다", () => {
    setup();

    expect(screen.getByText("후기 0개")).toBeTruthy();
    expect(screen.getByText("아직 후기가 없어요. 첫 후기를 남겨보세요.")).toBeTruthy();
  });

  it("불러오는 중이면 '없다'고 단정하지 않는다", () => {
    hooks.useReviews.mockReturnValue({ data: undefined, isLoading: true });
    setup();

    expect(screen.queryByText(/아직 후기가 없어요/)).toBeNull();
  });

  it("작성자·작성 시점·태그를 함께 보여준다", () => {
    hooks.useReviews.mockReturnValue({
      data: [
        makeReview({
          id: "r1",
          authorName: "콩이네",
          createdAtLabel: "2일 전",
          text: "그늘이 많아요",
          tags: [{ code: "LEASH_REQUIRED", label: "목줄 필수", category: "PET_CONDITION" }],
        }),
      ],
      isLoading: false,
    });
    setup();

    expect(screen.getByText("후기 1개")).toBeTruthy();
    expect(screen.getByText("콩이네")).toBeTruthy();
    expect(screen.getByText("2일 전")).toBeTruthy();
    expect(screen.getByText("그늘이 많아요")).toBeTruthy();
  });

  it("사진을 붙인 후기는 누가 올린 사진인지 대체 텍스트로 밝힌다", () => {
    hooks.useReviews.mockReturnValue({
      data: [makeReview({ id: "r1", authorName: "콩이네", photoUrl: "data:image/png;base64,AAA" })],
      isLoading: false,
    });
    setup();

    expect(screen.getByAltText("콩이네님이 첨부한 사진")).toBeTruthy();
  });
});

describe("후기 더 보기", () => {
  /** 작성자 이름만 다른 후기 n개 — 몇 번째까지 그렸는지 이름으로 센다. */
  const 후기들 = (count: number) =>
    Array.from({ length: count }, (_, i) => makeReview({ id: `r${i + 1}`, authorName: `작성자${i + 1}` }));

  it("처음에는 3개까지만 그린다 — 나머지는 버튼으로 미룬다", () => {
    hooks.useReviews.mockReturnValue({ data: 후기들(7), isLoading: false });
    setup();

    expect(screen.getByText("후기 7개")).toBeTruthy();
    expect(screen.getByText("작성자3")).toBeTruthy();
    expect(screen.queryByText("작성자4")).toBeNull();
    expect(screen.getByRole("button", { name: "더 보기 · 4개 남음" })).toBeTruthy();
  });

  it("버튼은 한 번에 늘어나는 개수가 아니라 남은 개수를 말한다 — '4개 더 보기'는 4개가 다 나온다고 읽힌다", () => {
    hooks.useReviews.mockReturnValue({ data: 후기들(7), isLoading: false });
    setup();

    expect(screen.queryByRole("button", { name: /4개 더 보기/ })).toBeNull();
  });

  it("더 보기는 10개씩 크게 연다 — 목록이 처음으로 되감기지도 않는다", async () => {
    hooks.useReviews.mockReturnValue({ data: 후기들(16), isLoading: false });
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "더 보기 · 13개 남음" }));

    expect(screen.getByText("작성자1")).toBeTruthy();
    expect(screen.getByText("작성자13")).toBeTruthy();
    expect(screen.queryByText("작성자14")).toBeNull();
    expect(screen.getByRole("button", { name: "더 보기 · 3개 남음" })).toBeTruthy();
  });

  it("남은 게 10개보다 적으면 한 번에 다 펼친다", async () => {
    hooks.useReviews.mockReturnValue({ data: 후기들(7), isLoading: false });
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "더 보기 · 4개 남음" }));

    expect(screen.getByText("작성자7")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /더 보기/ })).toBeNull();
  });

  it("3개 이하면 버튼을 만들지 않는다", () => {
    hooks.useReviews.mockReturnValue({ data: 후기들(3), isLoading: false });
    setup();

    expect(screen.getByText("작성자3")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /더 보기/ })).toBeNull();
  });
});

describe("후기 쓰기", () => {
  it("로그인했으면 작성 화면으로 보낸다 — 동명 장소 대응을 위해 id도 함께 넘긴다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "후기 쓰기" }));

    expect(nav.push).toHaveBeenCalledWith("/place/%ED%95%9C%EB%B0%AD%EC%88%98%EB%AA%A9%EC%9B%90/review?id=p1");
  });

  it("비로그인이면 작성 화면 대신 로그인 창을 연다", async () => {
    useAuthStore.setState({ isLoggedIn: false });
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "후기 쓰기" }));

    expect(nav.push).not.toHaveBeenCalled();
    expect(loginModalOpen()).toBe(true);
  });

  it("버튼은 후기 목록 바로 위 한 곳에만 있다 — 같은 동작을 두 번 노출하지 않는다", () => {
    setup();

    expect(screen.getAllByRole("button", { name: "후기 쓰기" })).toHaveLength(1);
  });
});

describe("동명 장소", () => {
  it("주소에 id가 있으면 이름이 같아도 그 id의 장소를 보여준다", () => {
    const 다른구_한밭수목원 = makePlace({ id: "p2", name: "한밭수목원", district: "유성구", category: "맛집" });
    hooks.usePlaces.mockReturnValue({ data: [한밭수목원, 다른구_한밭수목원], isLoading: false });
    search.params = new URLSearchParams("id=p2");

    setup();

    expect(screen.getByText("유성구")).toBeTruthy();
  });
});
