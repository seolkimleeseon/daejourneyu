"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { TabPlaceholder } from "@/components/shell/TabPlaceholder";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { nightsLabel } from "@/lib/courseFormat";
import { useCourseStore } from "@/stores/useCourseStore";
import { mockCourseSchedules } from "@/mocks";
import type { CourseSource } from "@/types";

const SOURCE_LABEL: Record<CourseSource, string> = {
  ai: "AI 추천",
  manual: "직접 지음",
  saved: "내가 담은 코스",
};

const SOURCE_TONE: Record<CourseSource, "purple" | "brand" | "coral"> = {
  ai: "purple",
  manual: "brand",
  saved: "coral",
};

export default function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const courses = useCourseStore((state) => state.courses);
  const course = courses.find((item) => item.id === params.courseId);
  const schedule = mockCourseSchedules.find((item) => item.courseId === params.courseId);

  if (!course) {
    return (
      <>
        <TopBar title="코스 상세" showBack />
        <TabPlaceholder emoji="🐾" message={"코스를 찾을 수 없어요\n삭제되었거나 접근할 수 없는 코스예요"} />
      </>
    );
  }

  return (
    <>
      <TopBar title={course.label} showBack />
      <div className="px-4 pb-6 pt-3">
        <div className="mb-3 flex flex-wrap gap-1">
          <Tag tone={SOURCE_TONE[course.source]} className="cursor-default">
            {SOURCE_LABEL[course.source]}
          </Tag>
          <Tag tone="neutral" className="cursor-default">
            {nightsLabel(course.nights)}
          </Tag>
          <Tag tone="neutral" className="cursor-default">
            {course.transport}
          </Tag>
          {course.shared ? (
            <Tag tone="amber" className="cursor-default">
              공유됨
            </Tag>
          ) : null}
        </div>

        {schedule ? (
          <div className="mb-4 rounded-xl bg-brand-100 px-4 py-3 text-xs font-semibold text-brand-700">
            📅 {schedule.date}에 가기로 했어요
            {schedule.festivalTitles.length > 0 ? ` · ${schedule.festivalTitles.join(", ")}` : ""}
          </div>
        ) : null}

        {course.days.map((day, dayIndex) => (
          <div key={dayIndex} className="mb-4">
            {course.days.length > 1 ? (
              <div className="mb-2 text-xs font-bold text-ink-muted">{dayIndex + 1}일차</div>
            ) : null}
            <div className="rounded-2xl border border-line bg-card py-1">
              {day.map((stop, stopIndex) => (
                <div
                  key={stop.placeId}
                  className="flex gap-3 px-4 py-3"
                  onClick={() => router.push(`/place/${encodeURIComponent(stop.name)}`)}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                    {stopIndex + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-ink">{stop.name}</div>
                    <div className="mt-0.5 text-xs text-ink-muted">
                      {stop.district} · {stop.category}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Tag tone={stop.petFriendly ? "brand" : "coral"} className="cursor-default px-2 py-1 text-[10px]">
                        {stop.petFriendly ? "🐾 동반 가능" : "🚫 동반 불가"}
                      </Tag>
                      <Tag tone="neutral" className="cursor-default px-2 py-1 text-[10px]">
                        {stop.condition}
                      </Tag>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <Button
          variant="secondary"
          className="mt-2"
          onClick={() => router.push(`/schedule/course/${course.id}/schedule`)}
        >
          {schedule ? "✏️ 여행 계획 편집하기" : "📅 일정을 추가하기"}
        </Button>
        {course.source !== "saved" && !course.shared ? (
          <Button
            variant="text"
            className="mt-2"
            onClick={() => router.push(`/schedule/course/${course.id}/share`)}
          >
            🧭 이 코스 둘러보기에 공유하기
          </Button>
        ) : null}
      </div>
    </>
  );
}
