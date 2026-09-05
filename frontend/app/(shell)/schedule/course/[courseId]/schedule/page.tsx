"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoginRequiredGate } from "@/components/course/LoginRequiredGate";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { useSyncCoursesFromApi } from "@/hooks/useSyncCoursesFromApi";
import { useToastStore } from "@/stores/useToastStore";

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CourseScheduleAddPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  useSyncCoursesFromApi();
  const showToast = useToastStore((state) => state.show);

  const course = useCourseStore((state) => state.courses.find((c) => c.id === params.courseId));
  const schedule = useCourseStore((state) => state.schedules.find((s) => s.courseId === params.courseId));
  const setSchedule = useCourseStore((state) => state.setSchedule);
  const removeSchedule = useCourseStore((state) => state.removeSchedule);

  const [date, setDate] = useState(schedule?.date ?? todayYmd());
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
      await setSchedule(course.id, date);
      showToast("일정을 등록했어요");
      router.back();
    } catch {
      showToast("일정 등록에 실패했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await removeSchedule(course.id);
      showToast("일정을 취소했어요");
      router.back();
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
          <span className="text-lg">🐾</span>
          <span className="text-sm font-bold text-ink">{course.label}</span>
        </Card>

        <label className="mt-4 block text-xs font-semibold text-ink-muted">언제 갈까요?</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-line bg-card px-3 py-3 text-sm text-ink outline-none focus:border-brand-400"
        />

        <Button className="mt-5" onClick={handleSave} disabled={saving}>
          <span>📅</span>
          {schedule ? "일정 수정하기" : "일정 등록하기"}
        </Button>

        {schedule ? (
          <Button variant="secondary" className="mt-2 text-accent-coral" onClick={handleRemove} disabled={saving}>
            <span>🗑️</span>일정 취소
          </Button>
        ) : null}
      </div>
    </>
  );
}
