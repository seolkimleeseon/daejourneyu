"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { TabPlaceholder } from "@/components/shell/TabPlaceholder";
import { CourseCard } from "@/components/course/CourseCard";
import { useCourseStore } from "@/stores/useCourseStore";
import { useSyncCoursesFromApi } from "@/hooks/useSyncCoursesFromApi";
import { mockCourseSchedules } from "@/mocks";

export default function CourseVaultPage() {
  const router = useRouter();
  useSyncCoursesFromApi();
  const storeCourses = useCourseStore((state) => state.courses);
  const courses = [...storeCourses].reverse();
  const scheduledCourseIds = new Set(mockCourseSchedules.map((schedule) => schedule.courseId));

  return (
    <>
      <TopBar title="코스 보관함" showBack />
      <div className="px-4 pb-6 pt-3">
        <div className="mb-2 px-1 text-xs text-ink-muted">보관함 코스 {courses.length}개</div>
        {courses.length > 0 ? (
          courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              hasUpcomingSchedule={scheduledCourseIds.has(course.id)}
              onClick={() => router.push(`/schedule/course/${course.id}`)}
            />
          ))
        ) : (
          <TabPlaceholder emoji="🐾" message={"보관함이 비어 있어요\n코스를 만들어 보세요"} />
        )}
      </div>
    </>
  );
}
