/**
 * 온보딩(첫 진입 소개 화면)을 이미 본 사용자인지 기록한다.
 *
 * 띄우는 조건은 딱 두 가지다 —
 *   1. 앱 루트(`/`)로 들어왔고
 *   2. 이 플래그가 없을 때(= 아직 온보딩을 끝내지 않았거나 방금 로그아웃했을 때)
 * 플래그는 "앱을 한 바퀴 돌아본 계정이 쓰는 중"이라는 뜻이라, 로그아웃하면
 * `clearOnboardingSeen()`으로 지워서 다음 진입에 다시 소개 화면부터 보게 한다.
 *
 * TODO(api): 계정별로 기억해야 하면 서버의 사용자 프로필로 옮긴다. 지금은 기기 단위로 충분하다.
 */
const STORAGE_KEY = "daejourneyu:onboarded";

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // 시크릿 모드 등 localStorage 접근이 막힌 환경에서는 온보딩을 반복해 띄우지 않는다.
    return true;
  }
}

export function markOnboardingSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // 저장에 실패해도 화면 흐름은 그대로 진행한다.
  }
}

/** 로그아웃 시 호출. 다음 진입이 다시 온보딩부터 시작하도록 되돌린다. */
export function clearOnboardingSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 지우지 못해도 로그아웃 자체는 계속 진행한다.
  }
}
