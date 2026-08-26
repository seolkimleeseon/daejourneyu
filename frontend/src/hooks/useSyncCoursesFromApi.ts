import { useEffect } from "react";
import { useCourseStore } from "@/stores/useCourseStore";
import { useCourses } from "./useCourses";

/**
 * 스토어를 백엔드 목록으로 동기화한다. SCHEDULE 탭 안의 진입점(탭 루트/상세/보관함)마다 호출해서,
 * '/schedule'을 거치지 않고 코스 상세로 바로 딥링크해도(캘린더·카카오톡 공유 링크 등) 스토어에
 * 목데이터 2개만 남아있는 상태로 "코스를 찾을 수 없어요"가 뜨지 않게 한다.
 */
export function useSyncCoursesFromApi() {
  const setCourses = useCourseStore((state) => state.setCourses);
  const { data: apiCourses } = useCourses();

  useEffect(() => {
    if (apiCourses) setCourses(apiCourses);
  }, [apiCourses, setCourses]);
}
