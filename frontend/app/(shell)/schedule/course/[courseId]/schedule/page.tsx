"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { CourseButton as Button } from "@/components/course/CourseButton";
import { Card } from "@/components/ui/Card";
import { LoginRequiredGate } from "@/components/course/LoginRequiredGate";
import { MonthCalendarGrid } from "@/components/course/MonthCalendarGrid";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { useSyncCoursesFromApi } from "@/hooks/useSyncCoursesFromApi";
import { useToastStore } from "@/stores/useToastStore";

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** YYYY-MM-DD에서 days만큼 지난 날짜(YYYY-MM-DD). 월 넘어가는 계산은 Date에 맡긴다. */
function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export default function CourseScheduleAddPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  useSyncCoursesFromApi();
  const showToast = useToastStore((state) => state.show);

  const courses = useCourseStore((state) => state.courses);
  const course = courses.find((c) => c.id === params.courseId);
  const schedules = useCourseStore((state) => state.schedules);
  // .filter().sort()를 셀렉터 안에서 바로 하면 store가 갱신될 때마다(구독 중인 다른 필드가
  // 바뀌어도) 매번 새 배열을 만들어 불필요한 리렌더를 유발한다 — schedules 값 자체가 바뀔 때만
  // 다시 계산한다.
  const courseSchedules = useMemo(
    () => schedules.filter((s) => s.courseId === params.courseId).sort((a, b) => a.date.localeCompare(b.date)),
    [schedules, params.courseId]
  );

  /** 다른 코스까지 포함해, 이미 잡힌 모든 일정을 당일치기(점)/1박 이상(선)으로 나눠 달력에 표시한다. */
  const { dotDates, lineDates } = useMemo(() => {
    const dots = new Set<string>();
    const lines = new Set<string>();
    schedules.forEach((s) => {
      const nights = courses.find((c) => c.id === s.courseId)?.nights ?? 0;
      if (nights === 0) {
        dots.add(s.date);
      } else {
        for (let offset = 0; offset <= nights; offset++) lines.add(addDays(s.date, offset));
      }
    });
    return { dotDates: dots, lineDates: lines };
  }, [schedules, courses]);
  const addSchedule = useCourseStore((state) => state.addSchedule);
  const removeSchedule = useCourseStore((state) => state.removeSchedule);

  const [date, setDate] = useState(todayYmd());
  const [saving, setSaving] = useState(false);

  if (!isLoggedIn) {
    return (
      <>
        <TopBar title="일정 추가" showBack />
        <LoginRequiredGate message="일정을 등록하려면 로그인해주세요" />
      </>
    );
  }

  if (!course) {
    return (
      <>
        <TopBar title="일정 추가" showBack />
        <div className="px-4 py-16 text-center text-sm text-ink-muted">코스를 찾을 수 없어요</div>
      </>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await addSchedule(course.id, date);
      showToast("일정을 등록했어요");
      router.push(`/schedule?tab=calendar&date=${date}`);
    } catch {
      showToast("일정 등록에 실패했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (scheduleId: string) => {
    setSaving(true);
    try {
      await removeSchedule(scheduleId);
      showToast("일정을 취소했어요");
    } catch {
      showToast("일정 취소에 실패했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopBar title="일정 추가" showBack />
      <div className="px-4 pb-6 pt-3">
        <Card className="flex items-center gap-2">
          <Emoji3D emoji="🐾" size={20} shadow={false} />
          <span className="text-sm font-bold text-ink">{course.label}</span>
        </Card>

        {courseSchedules.length > 0 ? (
          <div className="mt-4">
            <div className="mb-1.5 text-xs font-semibold text-ink-muted">등록된 일정</div>
            <div className="flex flex-col gap-1.5">
              {courseSchedules.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-line bg-card px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-1 text-ink">
                    <Emoji3D emoji="📅" size={14} shadow={false} />
                    {s.date}
                  </span>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleRemove(s.id)}
                    className="text-xs font-semibold text-accent-coral disabled:opacity-40"
                  >
                    취소
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <label className="mt-4 mb-1.5 block text-xs font-semibold text-ink-muted">새 날짜에 추가할까요?</label>
        <MonthCalendarGrid
          selectedDate={date}
          onSelectDate={setDate}
          nights={course.nights}
          markedDates={dotDates}
          lineDates={lineDates}
        />
        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1">
            <Emoji3D emoji="📅" size={12} shadow={false} />
            선택한 날짜: {date}
            {course.nights > 0 ? ` ~ ${addDays(date, course.nights)}` : ""}
          </span>
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-brand" /> 당일치기
            </span>
            <span className="flex items-center gap-1">
              <span className="h-[3px] w-2.5 rounded-full bg-accent-coral" /> 1박 이상
            </span>
          </span>
        </div>

        <Button className="mt-5" onClick={handleSave} disabled={saving}>
          <Emoji3D emoji="📅" size={16} shadow={false} />일정 등록하기
        </Button>
      </div>
    </>
  );
}
