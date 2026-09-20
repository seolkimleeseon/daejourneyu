import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { makePlace } from "@/test/fixtures";
import BakeryCoursePage from "./page";

const state = vi.hoisted(() => ({ placesError: false, refetchPlaces: vi.fn(), places: [] as unknown[], batches: [] as number[] }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }), usePathname: () => "/schedule/course/new/bakery" }));
vi.mock("@tanstack/react-query", () => ({ useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
  state.batches.push(queryKey[2] as number);
  return { data: [], isPending: false, isError: false, refetch: vi.fn() };
} }));
vi.mock("@/hooks/usePickablePlaces", () => ({ usePickablePlaces: () => ({
  data: state.places, isPending: false, isError: state.placesError, refetch: state.refetchPlaces,
}) }));
vi.mock("../mbti/steps/GeneratedResultStep", () => ({ GeneratedResultStep: () => null }));

beforeEach(() => {
  state.placesError = false;
  state.refetchPlaces.mockReset();
  state.places = [];
  state.batches = [];
});

it("현재 후보로 코스가 안 되면 다른 빵집 묶음을 자동으로 두 번 확인한다", async () => {
  state.places = [makePlace({ id: "walk", category: "산책", petFriendly: true })];
  render(<BakeryCoursePage />);
  await waitFor(() => expect(state.batches).toContain(2));
});

it("산책 장소 API가 실패하면 지역에 코스가 없다고 오인시키지 않는다", () => {
  state.placesError = true;
  render(<BakeryCoursePage />);
  expect(screen.getByText("산책 장소 정보를 불러오지 못했어요.")).toBeTruthy();
  expect(screen.queryByText(/이 지역에서는 가까운 빵집/)).toBeNull();
});
