import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * KAKAO_JS_KEY를 모듈 최상단에서 한 번 읽으므로, 키가 있고 없고를 나누려면 env를 세운 뒤
 * 모듈을 다시 불러와야 한다.
 */
async function loadKakaoLib(jsKey = "test-js-key") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_KAKAO_JS_KEY", jsKey);
  return import("./kakao");
}

const sendDefault = vi.fn();
const init = vi.fn();

/** 카카오 SDK 자리에 놓을 최소 대역 — init을 부르면 초기화된 것으로 친다. */
function fakeSdk({ initialized = false, initWorks = true } = {}) {
  let ready = initialized;
  init.mockImplementation(() => {
    if (initWorks) ready = true;
  });
  return {
    init,
    isInitialized: () => ready,
    Share: { sendDefault },
  };
}

/** 브라우저 환경을 흉내 낸다 — sdk가 없으면 SDK 스크립트가 아직 안 붙은 상태. */
function giveBrowser(sdk?: ReturnType<typeof fakeSdk>) {
  vi.stubGlobal("window", {
    location: { origin: "https://daejourneyu.vercel.app" },
    ...(sdk ? { Kakao: sdk } : {}),
  });
}

/** 카카오톡으로 넘어간 템플릿. */
function sentTemplate() {
  return sendDefault.mock.lastCall?.[0];
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("열 수 없는 경우", () => {
  it("서버에서는 열지 않고 그 사실을 알린다 — 던져서 화면을 깨지 않는다", async () => {
    const { shareTextToKakao } = await loadKakaoLib();

    const result = shareTextToKakao({ title: "유성 산책 코스", description: "당일치기 · 3곳" });

    expect(result).toEqual({ ok: false, reason: "브라우저에서만 사용할 수 있어요" });
    expect(sendDefault).not.toHaveBeenCalled();
  });

  it("SDK 스크립트가 아직 안 붙었으면 그 사유를 준다", async () => {
    giveBrowser();
    const { shareTextToKakao } = await loadKakaoLib();

    const result = shareTextToKakao({ title: "유성 산책 코스", description: "당일치기 · 3곳" });

    expect(result).toEqual({ ok: false, reason: "카카오 SDK를 아직 불러오지 못했어요" });
  });

  it("앱 키가 없으면 초기화를 시도하지 않고 설정 문제라고 알린다", async () => {
    giveBrowser(fakeSdk());
    const { shareTextToKakao } = await loadKakaoLib("");

    const result = shareTextToKakao({ title: "유성 산책 코스", description: "당일치기 · 3곳" });

    expect(result).toEqual({ ok: false, reason: "카카오 앱 키가 설정되지 않았어요" });
    expect(init).not.toHaveBeenCalled();
    expect(sendDefault).not.toHaveBeenCalled();
  });

  it("초기화해도 준비가 안 되면 보내지 않는다 — 잘못된 키일 수 있다", async () => {
    giveBrowser(fakeSdk({ initWorks: false }));
    const { shareTextToKakao } = await loadKakaoLib();

    const result = shareTextToKakao({ title: "유성 산책 코스", description: "당일치기 · 3곳" });

    expect(result.ok).toBe(false);
    expect(sendDefault).not.toHaveBeenCalled();
  });
});

describe("초기화", () => {
  it("아직 초기화 전이면 앱 키로 한 번 초기화하고 보낸다", async () => {
    giveBrowser(fakeSdk());
    const { shareTextToKakao } = await loadKakaoLib("test-js-key");

    const result = shareTextToKakao({ title: "유성 산책 코스", description: "당일치기 · 3곳" });

    expect(init).toHaveBeenCalledWith("test-js-key");
    expect(result.ok).toBe(true);
  });

  it("이미 초기화돼 있으면 다시 하지 않는다", async () => {
    giveBrowser(fakeSdk({ initialized: true }));
    const { shareTextToKakao } = await loadKakaoLib();

    shareTextToKakao({ title: "유성 산책 코스", description: "당일치기 · 3곳" });

    expect(init).not.toHaveBeenCalled();
    expect(sendDefault).toHaveBeenCalledTimes(1);
  });
});

describe("보내는 내용", () => {
  beforeEach(() => {
    giveBrowser(fakeSdk({ initialized: true }));
  });

  it("제목과 설명을 줄바꿈으로 이어 한 덩어리로 보낸다", async () => {
    const { shareTextToKakao } = await loadKakaoLib();

    shareTextToKakao({ title: "유성 산책 코스", description: "당일치기 · 3곳" });

    expect(sentTemplate()).toMatchObject({
      objectType: "text",
      text: "유성 산책 코스\n당일치기 · 3곳",
    });
  });

  it("받은 경로를 지금 보고 있는 사이트 주소에 붙여 링크로 만든다", async () => {
    const { shareTextToKakao } = await loadKakaoLib();

    shareTextToKakao({ title: "코스", description: "설명", path: "/schedule/course/c1" });

    expect(sentTemplate().link).toEqual({
      mobileWebUrl: "https://daejourneyu.vercel.app/schedule/course/c1",
      webUrl: "https://daejourneyu.vercel.app/schedule/course/c1",
    });
  });

  it("갈 곳을 안 주면 홈으로 연결한다 — 저장 전이라 상세 페이지가 없을 수 있다", async () => {
    const { shareTextToKakao } = await loadKakaoLib();

    shareTextToKakao({ title: "코스", description: "설명" });

    expect(sentTemplate().link.webUrl).toBe("https://daejourneyu.vercel.app/");
  });

  it("열었으면 사유를 남기지 않는다", async () => {
    const { shareTextToKakao } = await loadKakaoLib();

    const result = shareTextToKakao({ title: "코스", description: "설명" });

    expect(result).toEqual({ ok: true });
  });
});
