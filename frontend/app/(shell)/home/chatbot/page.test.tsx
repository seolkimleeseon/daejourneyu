import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { usePetStore } from "@/stores/usePetStore";
import { useToastStore } from "@/stores/useToastStore";
import { makePlace, makeStop } from "@/test/fixtures";
import ChatbotPage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav, usePathname: () => "/home/chatbot" }));

const pickable = vi.hoisted(() => ({ usePickablePlaces: vi.fn() }));
vi.mock("@/hooks/usePickablePlaces", () => ({ usePickablePlaces: pickable.usePickablePlaces }));

const addCourse = vi.fn();
const fetchMock = vi.fn();

const courseReply = {
  responseType: "course",
  label: "유성 산책 코스",
  emoji: null,
  nights: 0,
  transport: "자차",
  source: "ai",
  shared: false,
  days: [[makeStop({ placeId: "a", name: "갑천", district: "유성구", category: "산책" })]],
};

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

function setup() {
  const view = render(<ChatbotPage />);
  return { ...view, user: userEvent.setup({ advanceTimers: vi.advanceTimersByTime }) };
}

const sendBox = () => screen.getByPlaceholderText(/유성구에서 산책하기 좋은 곳/);

/** 마지막 말풍선 — 봇 답이 여기 들어온다. */
function lastBubble(container: HTMLElement): HTMLElement {
  const bubbles = container.querySelectorAll(".max-w-\\[76\\%\\]");
  return bubbles[bubbles.length - 1] as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  // jsdom에는 스크롤이 없다 — 새 메시지가 올 때마다 목록을 내리는 코드가 터지지 않게 둔다.
  vi.stubGlobal("fetch", fetchMock);
  HTMLElement.prototype.scrollTo = vi.fn();
  fetchMock.mockResolvedValue(jsonResponse({ responseType: "chat", message: "안내 문구" }));
  pickable.usePickablePlaces.mockReturnValue({ data: [makePlace({ id: "a", name: "갑천", district: "유성구", category: "산책" })] });
  addCourse.mockReturnValue({ id: "c1" });
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: null });
  useToastStore.setState({ message: null, key: 0 });
  useCourseStore.setState({ addCourse });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("첫 화면", () => {
  it("무엇을 해줄 수 있는지 인사로 먼저 알린다", () => {
    setup();

    expect(screen.getByText(/대저니유 안내입니다/)).toBeTruthy();
  });

  it("무엇을 물어볼지 막막하지 않게 예시를 깔아 둔다", () => {
    setup();

    expect(screen.getByRole("button", { name: "코스는 어떻게 만들어?" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "조용히 산책하기 좋은 곳" })).toBeTruthy();
  });
});

describe("자주 묻는 질문", () => {
  it("아는 질문은 서버에 묻지 않고 곧장 답한다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "코스는 어떻게 만들어?" }));

    expect(screen.getByText(/내 여정 탭에서 MBTI 추천·AI 추천·직접 짓기/)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("답 끝에 갈 곳을 붙여준다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "코스는 어떻게 만들어?" }));
    await user.click(screen.getByRole("button", { name: /코스 만들러 가기/ }));

    expect(nav.push).toHaveBeenCalledWith("/schedule");
  });

  it("똑같이 치지 않아도 키워드로 알아듣는다 — 띄어쓰기도 따지지 않는다", async () => {
    const { user } = setup();

    await user.type(sendBox(), "이앱 뭐하는곳이야?{Enter}");

    expect(screen.getByText(/대전 5개 구의 반려동물 동반 여행지/)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("코스 요청은 FAQ가 가로채지 않는다", () => {
  it.each(["코스짜줘", "강아지랑 산책할건데 코스 짜줘", "코스 만들어줘"])(
    "\"%s\"는 AI에게 묻는다",
    async (text) => {
      const { user } = setup();

      await user.type(sendBox(), `${text}{Enter}`);

      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      expect(screen.queryByText(/내 여정 탭에서 MBTI 추천/)).toBeNull();
    }
  );

  it("방법을 묻는 말은 여전히 안내문으로 답한다", async () => {
    const { user } = setup();

    await user.type(sendBox(), "코스 만드는 방법 알려줘{Enter}");

    expect(screen.getByText(/내 여정 탭에서 MBTI 추천/)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("보내기", () => {
  it("빈 칸은 보내지 않는다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "전송" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("공백만 친 것도 보내지 않는다", async () => {
    const { user } = setup();

    await user.type(sendBox(), "   {Enter}");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("보내고 나면 입력창을 비운다", async () => {
    const { user } = setup();

    await user.type(sendBox(), "유성구 산책{Enter}");

    expect((sendBox() as HTMLInputElement).value).toBe("");
  });

  it("모르는 질문은 서버에 물어본다", async () => {
    const { user } = setup();

    await user.type(sendBox(), "유성구 산책{Enter}");

    const body = JSON.parse(fetchMock.mock.lastCall?.[1].body as string);
    expect(body).toMatchObject({ prompt: "유성구 산책", nights: 0, transport: "자차" });
  });

  it("기간과 이동수단을 말하면 그대로 서버에 넘긴다 — 1박 2일을 당일 코스로 바꾸지 않는다", async () => {
    const { user } = setup();

    await user.type(sendBox(), "대덕구 1박 2일 지하철 코스{Enter}");

    const body = JSON.parse(fetchMock.mock.lastCall?.[1].body as string);
    expect(body).toMatchObject({ nights: 1, transport: "대중교통" });
  });
});

describe("답이 오기까지", () => {
  it("기다리는 동안 빈칸이 아니라 무언가 하고 있다는 걸 보여준다", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { user } = setup();

    await user.type(sendBox(), "유성구 산책{Enter}");

    expect(screen.getByText(/킁킁 냄새 맡는 중/)).toBeTruthy();
  });

  it("기다리는 문구를 번갈아 바꿔 멈춘 것처럼 보이지 않게 한다", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { user } = setup();
    await user.type(sendBox(), "유성구 산책{Enter}");

    act(() => vi.advanceTimersByTime(1100));

    expect(screen.getByText(/지도를 펼치는 중/)).toBeTruthy();
  });

  it("너무 오래 걸리면 하염없이 기다리게 두지 않고 끊어 알린다", async () => {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        })
    );
    const { user } = setup();
    await user.type(sendBox(), "유성구 산책{Enter}");

    act(() => vi.advanceTimersByTime(60000));

    await waitFor(() =>
      expect(screen.getByText("지금은 답변하기 어려워요. 잠시 후 다시 시도해주세요")).toBeTruthy()
    );
  });
});

describe("오래 걸릴 때", () => {
  it("10초가 지나도 답이 없으면 멈춘 게 아니라고 알린다", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { user } = setup();
    await user.type(sendBox(), "유성구 코스 짜줘{Enter}");

    act(() => vi.advanceTimersByTime(10000));

    expect(screen.getByText(/꼼꼼히 짜는 중이에요/)).toBeTruthy();
  });
});

describe("코스를 받은 뒤", () => {
  const reply = { ...courseReply, summary: "오전엔 산책하고 점심 뒤 카페로 이어져요" };

  it("왜 이렇게 짰는지 설명을 함께 보여준다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(reply));
    const { user } = setup();

    await user.type(sendBox(), "유성구 코스 짜줘{Enter}");

    await waitFor(() => expect(screen.getByText(/오전엔 산책하고 점심 뒤 카페로/)).toBeTruthy());
  });

  it("함께 가는 반려견의 크기·나이를 서버에 알려준다", async () => {
    usePetStore.setState({
      pets: [{ id: "pet1", name: "보리", breed: "말티즈", weightKg: 4, ageYears: 9, size: "소형견", emoji: "🐶" }],
      activePetIndex: 0,
    });
    const { user } = setup();

    await user.type(sendBox(), "유성구 코스 짜줘{Enter}");

    const body = JSON.parse(fetchMock.mock.lastCall?.[1].body as string);
    expect(body.pet).toEqual({ name: "보리", breed: "말티즈", size: "소형견", ageYears: 9 });
  });

  it("'다른 곳으로 다시'를 누르면 보여준 장소를 빼고 같은 조건으로 다시 묻는다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(reply));
    const { user } = setup();
    await user.type(sendBox(), "유성구 코스 짜줘{Enter}");
    await waitFor(() => expect(screen.getByRole("button", { name: /다른 곳으로 다시/ })).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /다른 곳으로 다시/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const body = JSON.parse(fetchMock.mock.lastCall?.[1].body as string);
    expect(body).toMatchObject({ prompt: "유성구 코스 짜줘", excludeIds: ["a"] });
  });

  it("당일·자차 코스에는 1박 2일·대중교통 버튼을 주고, 눌러서 조건을 바꿔 묻는다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(reply));
    const { user } = setup();
    await user.type(sendBox(), "유성구 코스 짜줘{Enter}");
    await waitFor(() => expect(screen.getByRole("button", { name: /1박 2일로 늘려줘/ })).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /1박 2일로 늘려줘/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const body = JSON.parse(fetchMock.mock.lastCall?.[1].body as string);
    expect(body).toMatchObject({ nights: 1, excludeIds: [] });
  });

  it("이미 1박이고 대중교통인 코스에는 그 버튼을 다시 주지 않는다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ...reply, nights: 1, transport: "대중교통" }));
    const { user } = setup();
    await user.type(sendBox(), "유성구 코스 짜줘{Enter}");
    await waitFor(() => expect(screen.getByRole("button", { name: /다른 곳으로 다시/ })).toBeTruthy());

    expect(screen.queryByRole("button", { name: /1박 2일로 늘려줘/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /대중교통으로 짜줘/ })).toBeNull();
  });
});

describe("답 받기", () => {
  it("코스가 아니라 잡담이면 말만 돌려준다 — 억지로 코스를 지어내지 않는다", async () => {
    const { container, user } = setup();

    await user.type(sendBox(), "안녕{Enter}");

    await waitFor(() => expect(screen.getByText("안내 문구")).toBeTruthy());
    expect(within(lastBubble(container)).queryByRole("button", { name: /이 코스 저장하기/ })).toBeNull();
  });

  it("코스로 답하면 담긴 장소와 저장 버튼을 함께 보여준다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(courseReply));
    const { user } = setup();

    await user.type(sendBox(), "유성구 산책{Enter}");

    await waitFor(() => expect(screen.getByText(/"유성 산책 코스"/)).toBeTruthy());
    expect(screen.getByText("갑천")).toBeTruthy();
    expect(screen.getByText("유성구 · 산책")).toBeTruthy();
    expect(screen.getByRole("button", { name: /이 코스 저장하기/ })).toBeTruthy();
  });

  it("추천한 장소를 누르면 그 장소 상세로 보낸다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(courseReply));
    const { user } = setup();
    await user.type(sendBox(), "유성구 산책{Enter}");
    await waitFor(() => expect(screen.getByText("갑천")).toBeTruthy());

    await user.click(screen.getByText("갑천"));

    expect(nav.push).toHaveBeenCalledWith("/place/%EA%B0%91%EC%B2%9C?id=a");
  });

  it("서버가 사유를 주면 그 사유를 그대로 전한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "AI 키가 설정되지 않았어요" }, false));
    const { user } = setup();

    await user.type(sendBox(), "유성구 산책{Enter}");

    await waitFor(() => expect(screen.getByText("AI 키가 설정되지 않았어요")).toBeTruthy());
  });

  it("사유를 모르면 기본 문구라도 남긴다 — 말풍선을 빈 채로 두지 않는다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false));
    const { user } = setup();

    await user.type(sendBox(), "유성구 산책{Enter}");

    await waitFor(() =>
      expect(screen.getByText("답을 만들지 못했어요. 잠시 후 다시 시도해주세요")).toBeTruthy()
    );
  });

  it("연결 자체가 끊겨도 말풍선을 남긴다", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const { user } = setup();

    await user.type(sendBox(), "유성구 산책{Enter}");

    await waitFor(() =>
      expect(screen.getByText("답을 만들지 못했어요. 잠시 후 다시 시도해주세요")).toBeTruthy()
    );
  });
});

describe("추천 코스 저장", () => {
  async function getCourseReply(user: ReturnType<typeof userEvent.setup>) {
    fetchMock.mockResolvedValue(jsonResponse(courseReply));
    await user.type(sendBox(), "유성구 산책{Enter}");
    await waitFor(() => expect(screen.getByRole("button", { name: /이 코스 저장하기/ })).toBeTruthy());
  }

  it("저장하면 알리고 그 코스 상세로 데려간다", async () => {
    const { user } = setup();
    await getCourseReply(user);

    await user.click(screen.getByRole("button", { name: /이 코스 저장하기/ }));

    expect(addCourse).toHaveBeenCalledWith(expect.objectContaining({ label: "유성 산책 코스", source: "ai" }));
    expect(useToastStore.getState().message).toBe("코스를 보관함에 저장했어요 🐾");
    expect(nav.push).toHaveBeenCalledWith("/schedule/course/c1");
  });

  it("비로그인이면 저장하지 않고 로그인부터 받는다", async () => {
    useAuthStore.setState({ isLoggedIn: false });
    const { user } = setup();
    await getCourseReply(user);

    await user.click(screen.getByRole("button", { name: /이 코스 저장하기/ }));

    expect(addCourse).not.toHaveBeenCalled();
    expect(screen.getByText("로그인이 필요해요").closest(".fixed")?.className).toContain("opacity-100");
  });

  it("로그인 화면을 다녀오느라 이 페이지가 다시 마운트돼도 저장을 이어간다", async () => {
    // 비로그인 상태에서 저장을 누르면 로그인 화면으로 이동하며 이 페이지가 언마운트된다 —
    // 그 사이 세션스토리지에 남겨둔 코스를, 로그인하고 돌아와 다시 마운트됐을 때 이어서 저장해야 한다.
    sessionStorage.setItem(
      "daejourneyu:chatbot-pending-course",
      JSON.stringify({ label: "유성 산책 코스", nights: 0, days: [], source: "ai", shared: false })
    );

    setup();

    await waitFor(() => expect(addCourse).toHaveBeenCalledWith(expect.objectContaining({ label: "유성 산책 코스" })));
    expect(sessionStorage.getItem("daejourneyu:chatbot-pending-course")).toBeNull();
  });
});
