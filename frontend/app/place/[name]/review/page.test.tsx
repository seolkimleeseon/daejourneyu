import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { makePlace } from "@/test/fixtures";
import type { ReviewTagOption } from "@/types";
import ReviewWritePage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav, usePathname: () => "/place/한밭수목원/review" }));

const hooks = vi.hoisted(() => ({
  usePlaces: vi.fn(),
  useReviewTags: vi.fn(),
  useCreateReview: vi.fn(),
}));
vi.mock("@/hooks/usePlaces", () => ({ usePlaces: hooks.usePlaces }));
vi.mock("@/hooks/useReviewTags", () => ({ useReviewTags: hooks.useReviewTags }));
vi.mock("@/hooks/useReviews", () => ({ useCreateReview: hooks.useCreateReview }));

const 한밭수목원 = makePlace({ id: "p1", name: "한밭수목원" });

const tagOptions: ReviewTagOption[] = [
  { code: "LEASH", label: "목줄 필수", category: "PET_CONDITION" },
  { code: "ALL_BREED", label: "전 견종 가능", category: "PET_CONDITION" },
  { code: "SHADE", label: "그늘 많음", category: "ENVIRONMENT" },
  { code: "WATER", label: "급수대 있음", category: "AMENITY" },
  { code: "KIND", label: "직원이 친절해요", category: "SERVICE" },
  { code: "CROWDED", label: "주말엔 붐벼요", category: "CAUTION" },
];

const mutate = vi.fn();

function setup(name = "한밭수목원") {
  const view = render(<ReviewWritePage params={{ name }} />);
  return { ...view, user: userEvent.setup() };
}

const tag = (label: string) => screen.getByRole("button", { name: label });
const submit = () => screen.getByRole("button", { name: /등록/ });

beforeEach(() => {
  vi.clearAllMocks();
  hooks.usePlaces.mockReturnValue({ data: [한밭수목원] });
  hooks.useReviewTags.mockReturnValue({ data: tagOptions });
  hooks.useCreateReview.mockReturnValue({ mutate, isPending: false });
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: null });
  useToastStore.setState({ message: null, key: 0 });
});

describe("들어갈 수 있는지", () => {
  it("비로그인이면 폼 대신 로그인이 필요하다고 알린다", () => {
    useAuthStore.setState({ isLoggedIn: false });
    setup();

    expect(screen.getByText("로그인이 필요해요.")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("없는 장소면 빈 폼을 띄우지 않는다 — 어디에 쓰는 후기인지 모른다", () => {
    setup("없는장소");

    expect(screen.getByText("존재하지 않는 장소예요.")).toBeTruthy();
  });

  it("어느 장소에 쓰는 후기인지 먼저 보여준다", () => {
    setup();

    expect(screen.getByText("한밭수목원")).toBeTruthy();
  });
});

describe("태그 고르기", () => {
  it("분류별로 묶고 정해진 순서로 세운다 — 주의할 점은 맨 끝이다", () => {
    const { container } = setup();

    const headings = Array.from(container.querySelectorAll(".text-\\[11px\\].font-bold")).map(
      (el) => el.textContent
    );
    expect(headings).toEqual([
      "반려동물 동반 조건",
      "공간 · 환경",
      "편의시설",
      "서비스 · 분위기",
      "주의할 점",
    ]);
  });

  it("고른 개수를 상한과 함께 센다", async () => {
    const { user } = setup();
    expect(screen.getByText("0/5")).toBeTruthy();

    await user.click(tag("목줄 필수"));

    expect(screen.getByText("1/5")).toBeTruthy();
  });

  it("다시 누르면 뺀다", async () => {
    const { user } = setup();

    await user.click(tag("목줄 필수"));
    await user.click(tag("목줄 필수"));

    expect(screen.getByText("0/5")).toBeTruthy();
  });

  it("5개를 넘기려 하면 조용히 무시하지 않고 상한을 알려준다", async () => {
    const { user } = setup();
    for (const label of ["목줄 필수", "전 견종 가능", "그늘 많음", "급수대 있음", "직원이 친절해요"]) {
      await user.click(tag(label));
    }

    await user.click(tag("주말엔 붐벼요"));

    expect(screen.getByText("5/5")).toBeTruthy();
    expect(useToastStore.getState().message).toBe("태그는 최대 5개까지 선택할 수 있어요");
  });

  it("하나도 안 고르면 등록을 막는다 — 글 없이 태그만으로도 쓸모 있는 후기다", () => {
    setup();

    expect(submit().hasAttribute("disabled")).toBe(true);
  });

  it("하나만 골라도 등록할 수 있다", async () => {
    const { user } = setup();

    await user.click(tag("목줄 필수"));

    expect(submit().hasAttribute("disabled")).toBe(false);
  });
});

describe("사진", () => {
  it("2MB가 넘으면 붙이지 않고 이유를 알려준다", async () => {
    const { container, user } = setup();
    const big = new File(["x".repeat(2 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });

    await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, big);

    expect(useToastStore.getState().message).toBe("사진 용량이 너무 커요 (2MB 이하로 올려주세요)");
    expect(screen.queryByAltText("첨부한 사진 미리보기")).toBeNull();
  });

  it("고른 사진을 바로 미리 보여준다", async () => {
    const { container, user } = setup();
    const small = new File(["hello"], "small.png", { type: "image/png" });

    await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, small);

    await waitFor(() => expect(screen.getByAltText("첨부한 사진 미리보기")).toBeTruthy());
  });
});

describe("등록", () => {
  it("고른 태그와 쓴 글을 함께 보낸다", async () => {
    const { user } = setup();
    await user.click(tag("목줄 필수"));
    await user.type(screen.getByRole("textbox"), "  그늘이 많아요  ");

    await user.click(submit());

    expect(mutate).toHaveBeenCalledWith(
      {
        placeId: "p1",
        placeName: "한밭수목원",
        text: "그늘이 많아요",
        photoUrl: undefined,
        tagCodes: ["LEASH"],
      },
      expect.anything()
    );
  });

  it("성공하면 알리고 장소 상세로 되돌린다 — 뒤로가기로 폼에 다시 오지 않게 replace한다", async () => {
    mutate.mockImplementation((_input, handlers) => handlers.onSuccess());
    const { user } = setup();
    await user.click(tag("목줄 필수"));

    await user.click(submit());

    expect(useToastStore.getState().message).toBe("후기가 등록되었어요");
    expect(nav.replace).toHaveBeenCalledWith("/place/%ED%95%9C%EB%B0%AD%EC%88%98%EB%AA%A9%EC%9B%90");
  });

  it("실패하면 쓴 내용을 날리지 않고 사유만 알린다", async () => {
    mutate.mockImplementation((_input, handlers) => handlers.onError());
    const { user } = setup();
    await user.click(tag("목줄 필수"));
    await user.type(screen.getByRole("textbox"), "그늘이 많아요");

    await user.click(submit());

    expect(useToastStore.getState().message).toContain("후기 등록에 실패했어요");
    expect(nav.replace).not.toHaveBeenCalled();
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("그늘이 많아요");
  });

  it("보내는 동안 버튼을 잠가 두 번 등록되지 않게 한다", () => {
    hooks.useCreateReview.mockReturnValue({ mutate, isPending: true });
    setup();

    expect(screen.getByRole("button", { name: "등록 중…" }).hasAttribute("disabled")).toBe(true);
  });
});
