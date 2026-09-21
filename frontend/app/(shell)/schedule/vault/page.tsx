"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { TabPlaceholder } from "@/components/shell/TabPlaceholder";
import { CourseCard } from "@/components/course/CourseCard";
import { LoginRequiredGate } from "@/components/course/LoginRequiredGate";
import { SwipeToDeleteRow } from "@/components/course/SwipeToDeleteRow";
import { Button, Modal } from "@/components/ui";
import type { Course } from "@/types";
import { useToastStore } from "@/stores/useToastStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSyncCoursesFromApi } from "@/hooks/useSyncCoursesFromApi";

export default function CourseVaultPage() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  useSyncCoursesFromApi();
  const storeCourses = useCourseStore((state) => state.courses);
  const hasSynced = useCourseStore((state) => state.hasSynced);
  const storeSchedules = useCourseStore((state) => state.schedules);
  const deleteCourse = useCourseStore((state) => state.deleteCourse);
  const showToast = useToastStore((state) => state.show);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const courses = [...storeCourses].reverse();
  const scheduleCountByCourse = new Map<string, number>();
  for (const schedule of storeSchedules) {
    scheduleCountByCourse.set(schedule.courseId, (scheduleCountByCourse.get(schedule.courseId) ?? 0) + 1);
  }

  if (!isLoggedIn) {
    return (
      <>
        <TopBar title="코스 보관함" showBack />
        <LoginRequiredGate message="보관함에 담긴 코스는 로그인해야 볼 수 있어요" />
      </>
    );
  }

  if (!hasSynced) {
    return (
      <>
        <TopBar title="코스 보관함" showBack />
        <div className="py-16 text-center text-xs text-ink-muted">불러오는 중…</div>
      </>
    );
  }

  return (
    <>
      <TopBar title="코스 보관함" showBack />
      <div className="px-4 pb-6 pt-3">
        <div className="mb-2 px-1 text-xs text-ink-muted">보관함 코스 {courses.length}개</div>
        {courses.length > 0 ? (
          courses.map((course) => (
            <SwipeToDeleteRow key={course.id} onDelete={() => setDeleteTarget(course)}>
              <CourseCard
                course={course}
                scheduleCount={scheduleCountByCourse.get(course.id) ?? 0}
                onClick={() => router.push(`/schedule/course/${course.id}`)}
                onAddSchedule={() => router.push(`/schedule/course/${course.id}/schedule`)}
                onDelete={() => setDeleteTarget(course)}
              />
            </SwipeToDeleteRow>
          ))
        ) : (
          <TabPlaceholder icon3D emoji="🐾" message={"보관함이 비어 있어요\n코스를 만들어 보세요"} />
        )}
      </div>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        emoji="🗑️"
        title="이 코스를 삭제할까요?"
        description={deleteTarget ? `‘${deleteTarget.label}’ 코스를 삭제하면 되돌릴 수 없어요` : undefined}
      >
        <Button
          variant="primary"
          className="bg-accent-coral active:bg-accent-coral"
          onClick={() => {
            if (deleteTarget) deleteCourse(deleteTarget.id);
            setDeleteTarget(null);
            showToast("코스를 삭제했어요");
          }}
        >
          삭제하기
        </Button>
        <Button variant="text" onClick={() => setDeleteTarget(null)}>
          취소
        </Button>
      </Modal>
    </>
  );
}
