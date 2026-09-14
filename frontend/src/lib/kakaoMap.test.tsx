import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KakaoMaps } from "./kakaoMap";

/*
 * 컴포넌트는 없지만 document·window를 직접 만지는 로더라 jsdom이 필요하다 —
 * 이 저장소는 확장자로 환경이 갈리므로(.ts=node / .tsx=jsdom) .tsx로 둔다.
 *
 * 앱 키를 모듈 최상단에서 읽고 성공한 로더를 모듈 전역에 캐시하므로, 케이스마다 모듈을 새로
 * 불러와 키와 캐시를 같이 초기화한다.
 */
async function loadModule(jsKey = "test-js-key") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_KAKAO_JS_KEY", jsKey);
  return import("./kakaoMap");
}

/** 로더가 head에 붙인 SDK 스크립트들. */
function injectedScripts(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll<HTMLScriptElement>('script[data-kakao-map="true"]'));
}

/** SDK가 자리를 잡은 상태를 만든다 — maps.load(cb)가 준비 완료를 알린다. */
function giveSdk(): KakaoMaps {
  const maps = { load: (callback: () => void) => callback() } as unknown as KakaoMaps;
  window.kakao = { maps };
  return maps;
}

beforeEach(() => {
  delete window.kakao;
  document.head.querySelectorAll("script").forEach((script) => script.remove());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("불러올 수 없는 경우", () => {
  it("서버에서는 시도하지 않고 사유와 함께 끝낸다", async () => {
    const { loadKakaoMap } = await loadModule();
    vi.stubGlobal("window", undefined);

    await expect(loadKakaoMap()).rejects.toThrow("브라우저에서만 지도를 불러올 수 있어요");

    vi.unstubAllGlobals();
    expect(injectedScripts()).toHaveLength(0);
  });

  it("앱 키가 없으면 스크립트를 붙이지도 않는다 — 어차피 거부당한다", async () => {
    const { loadKakaoMap } = await loadModule("");

    await expect(loadKakaoMap()).rejects.toThrow("카카오 JS 키가 설정되지 않았어요");
    expect(injectedScripts()).toHaveLength(0);
  });

  it("스크립트가 못 받아지면 사유를 준다", async () => {
    const { loadKakaoMap } = await loadModule();
    const promise = loadKakaoMap();

    injectedScripts()[0].dispatchEvent(new Event("error"));

    await expect(promise).rejects.toThrow("카카오맵 SDK 로드에 실패했어요");
  });

  it("스크립트는 받았는데 kakao.maps가 없으면 성공으로 치지 않는다", async () => {
    const { loadKakaoMap } = await loadModule();
    const promise = loadKakaoMap();

    injectedScripts()[0].dispatchEvent(new Event("load"));

    await expect(promise).rejects.toThrow("카카오맵 SDK를 불러오지 못했어요");
  });
});

describe("스크립트 주입", () => {
  it("앱 키와 필요한 옵션을 실어 head에 붙인다", async () => {
    const { loadKakaoMap } = await loadModule("test-js-key");
    loadKakaoMap();

    const script = injectedScripts()[0];
    expect(script.parentElement).toBe(document.head);
    expect(script.src).toContain("appkey=test-js-key");
    // autoload=false여야 우리가 maps.load로 준비 시점을 잡을 수 있다.
    expect(script.src).toContain("autoload=false");
    // 좌표 없는 스탑을 이름으로 검색하는 services.Places에 필요하다.
    expect(script.src).toContain("libraries=services");
    expect(script.async).toBe(true);
  });

  it("SDK가 준비되면 maps를 넘겨준다", async () => {
    const { loadKakaoMap } = await loadModule();
    const promise = loadKakaoMap();

    const maps = giveSdk();
    injectedScripts()[0].dispatchEvent(new Event("load"));

    await expect(promise).resolves.toBe(maps);
  });

  it("load 이벤트가 와도 maps.load가 끝나기 전엔 넘기지 않는다 — SDK 내부 준비가 남았다", async () => {
    const { loadKakaoMap } = await loadModule();
    let ready = () => {};
    const maps = { load: (callback: () => void) => (ready = callback) } as unknown as KakaoMaps;
    window.kakao = { maps };
    const promise = loadKakaoMap();
    let settled = false;
    promise.then(() => (settled = true));

    await Promise.resolve();
    expect(settled).toBe(false);

    ready();
    await expect(promise).resolves.toBe(maps);
  });
});

describe("중복 주입 막기", () => {
  it("여러 번 불러도 스크립트는 하나만 붙인다", async () => {
    const { loadKakaoMap } = await loadModule();

    const first = loadKakaoMap();
    const second = loadKakaoMap();

    expect(injectedScripts()).toHaveLength(1);
    expect(second).toBe(first);
  });

  it("이미 SDK가 올라와 있으면 새로 받지 않고 바로 쓴다", async () => {
    const maps = giveSdk();
    const { loadKakaoMap } = await loadModule();

    await expect(loadKakaoMap()).resolves.toBe(maps);
    expect(injectedScripts()).toHaveLength(0);
  });

  it("스크립트만 이미 붙어 있으면 다시 받지 않고 그게 끝나길 기다린다", async () => {
    const first = await loadModule();
    first.loadKakaoMap();
    const script = injectedScripts()[0];

    // 모듈이 새로 평가돼 캐시가 비어도(HMR 등) 붙어 있는 스크립트를 알아본다.
    const second = await loadModule();
    const promise = second.loadKakaoMap();

    expect(injectedScripts()).toHaveLength(1);
    const maps = giveSdk();
    script.dispatchEvent(new Event("load"));
    await expect(promise).resolves.toBe(maps);
  });
});

describe("실패 후", () => {
  it("실패한 프로미스를 캐시에 남기지 않는다 — 남기면 다음 호출이 같은 실패를 되돌려준다", async () => {
    const { loadKakaoMap } = await loadModule();
    const failed = loadKakaoMap();
    injectedScripts()[0].dispatchEvent(new Event("error"));
    await expect(failed).rejects.toThrow();

    const retried = loadKakaoMap();

    expect(retried).not.toBe(failed);
    retried.catch(() => {});
  });

  it("성공한 뒤에는 다시 받지 않는다", async () => {
    const { loadKakaoMap } = await loadModule();
    const promise = loadKakaoMap();
    const maps = giveSdk();
    injectedScripts()[0].dispatchEvent(new Event("load"));
    await promise;

    await expect(loadKakaoMap()).resolves.toBe(maps);
    expect(injectedScripts()).toHaveLength(1);
  });
});
