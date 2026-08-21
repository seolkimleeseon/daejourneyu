"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { TabPlaceholder } from "@/components/shell/TabPlaceholder";
import { CourseCard } from "@/components/course/CourseCard";
import { TileButton } from "@/components/ui/TileButton";
import { useCourseStore } from "@/stores/useCourseStore";
import { mockCourseSchedules } from "@/mocks";

type ScheduleSegment = "내 코스" | "캘린더";

const VAULT_PREVIEW_COUNT = 5;

export default function SchedulePage() {
  const router = useRouter();
  const [segment, setSegment] = useState<ScheduleSegment>("내 코스");
  const storeCourses = useCourseStore((state) => state.courses);

  const courses = [...storeCourses].reverse();
  const preview = courses.slice(0, VAULT_PREVIEW_COUNT);
  const scheduledCourseIds = new Set(mockCourseSchedules.map((schedule) => schedule.courseId));

  return (
    <>
      <TopBar title="내 여정" />
      <div className="flex rounded-xl bg-line p-1 mx-4 mt-3">
        {(["내 코스", "캘린더"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSegment(tab)}
            className={
              segment === tab
                ? "flex-1 rounded-lg bg-card py-2 text-center text-xs font-semibold text-ink shadow-sm"
                : "flex-1 rounded-lg py-2 text-center text-xs font-semibold text-ink-muted"
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {segment === "내 코스" ? (
        <div className="px-4 pb-6 pt-4">
          <div className="mb-1 px-1 text-xs font-bold text-ink-muted">코스 만들기</div>
          <div className="mb-5 grid grid-cols-3 gap-2">
            <TileButton
              variant="filled"
              tone="brand"
              emoji="✨"
              title="MBTI 맞춤 코스"
              subtitle="성향 테스트로 코스 자동 생성"
              onClick={() => router.push("/schedule/course/new/mbti")}
            />
            <TileButton
              variant="filled"
              tone="purple"
              emoji="🤖"
              title="AI에게 물어보기"
              subtitle="말로 원하는 여행을 설명해요"
              onClick={() => router.push("/home/chatbot")}
            />
            <TileButton
              variant="filled"
              tone="coral"
              emoji="📍"
              title="직접 짓기"
              subtitle="가고 싶은 곳만 담아서"
              onClick={() => router.push("/schedule/course/new/manual")}
            />
          </div>

          <div className="mb-1 flex items-center justify-between px-1">
            <div className="text-xs font-bold text-ink-muted">코스 보관함</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">{courses.length}개</span>
              {courses.length > 0 ? (
                <button
                  type="button"
                  onClick={() => router.push("/schedule/vault")}
                  className="text-xs font-semibold text-brand"
                >
                  전체 보기 ›
                </button>
              ) : null}
            </div>
          </div>

          {courses.length > 0 ? (
            <>
              {preview.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  hasUpcomingSchedule={scheduledCourseIds.has(course.id)}
                  onClick={() => router.push(`/schedule/course/${course.id}`)}
                />
              ))}
              {courses.length > VAULT_PREVIEW_COUNT ? (
                <button
                  type="button"
                  onClick={() => router.push("/schedule/vault")}
                  className="flex min-h-11 w-full items-center justify-center rounded-lg border border-line-strong text-xs font-semibold text-ink-muted"
                >
                  코스 보관함 전체 보기 ({courses.length}개) ›
                </button>
              ) : null}
            </>
          ) : (
            <TabPlaceholder emoji="🐾" message={"보관함이 비어 있어요\n첫 코스를 만들어보세요"} />
          )}
        </div>
      ) : (
        <TabPlaceholder emoji="📅" message="캘린더는 다음 스텝에서 채웁니다." />
      )}
    </>
  );
}
