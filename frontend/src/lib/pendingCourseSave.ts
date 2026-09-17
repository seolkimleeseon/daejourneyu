import type { Course } from "@/types";

const KEY = "daejourneyu:pending-course-save";

/**
 * 비로그인 상태에서 코스 위저드로 다 담고 저장을 누르면 로그인 화면으로 이동하는데, 이메일
 * 로그인은 SPA 내 이동이라 컴포넌트 상태가 살아있지만 카카오 로그인은 외부 사이트를 거쳐
 * 페이지가 완전히 새로고침되므로 위저드의 React 상태(Zustand 포함)는 버티지 못한다 — 로그인
 * 화면으로 넘어가기 직전, 저장하려던 코스를 sessionStorage에 잠깐 맡겨두고 AuthHydrator가
 * 로그인 완료를 감지하면 대신 저장한다.
 */
export function stashPendingCourseSave(course: Omit<Course, "id">) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(course));
  } catch {
    // 프라이빗 모드 등으로 sessionStorage를 못 쓰면 포기한다 — 로그인 후 다시 시도해야 한다.
  }
}

/** 맡겨둔 코스가 있으면 꺼내면서 지운다(한 번만 저장되게). 없으면 null. */
export function consumePendingCourseSave(): Omit<Course, "id"> | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as Omit<Course, "id">;
  } catch {
    return null;
  }
}
