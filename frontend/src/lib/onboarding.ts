/**
 * 온보딩을 한 번이라도 끝낸 사용자인지 기록한다.
 * TODO(api): 인증이 붙으면 서버의 사용자 프로필(온보딩 완료 여부)로 옮긴다.
 *   지금은 목 세션이라 새로고침해도 유지되도록 localStorage에만 둔다.
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
