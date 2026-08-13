"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { CourseStepBar } from "@/components/course/CourseStepBar";
import { PlacePickerSheet } from "@/components/course/PlacePickerSheet";
import { NightsStep } from "./steps/NightsStep";
import { PlacesStep } from "./steps/PlacesStep";
import { ReviewStep } from "./steps/ReviewStep";
import { useCourseStore } from "@/stores/useCourseStore";
import { useToastStore } from "@/stores/useToastStore";
import { nearestNeighborRoute } from "@/lib/nearestNeighborRoute";
import type { Place } from "@/types";

const MANUAL_STEP_LABELS = ["설정", "장소", "동선"] as const;

function defaultCourseName() {
  const today = new Date();
  return `${today.getMonth() + 1}월 ${today.getDate()}일에 만든 코스`;
}

export default function ManualCourseWizardPage() {
  const router = useRouter();
  const addCourse = useCourseStore((state) => state.addCourse);
  const showToast = useToastStore((state) => state.show);

  const [step, setStep] = useState(0);
  const [nights, setNights] = useState(0);
  const [days, setDays] = useState<Place[][]>([[]]);
  const [startIds, setStartIds] = useState<Record<number, string>>({});
  const [activeDay, setActiveDay] = useState(0);
  const [reviewDays, setReviewDays] = useState<Place[][]>([[]]);
  const [reviewDay, setReviewDay] = useState(0);
  const [courseName, setCourseName] = useState("");

  const handleChangeNights = (next: number) => {
    setNights(next);
    setDays((prev) => {
      const needed = next + 1;
      const result = [...prev];
      while (result.length < needed) result.push([]);
      while (result.length > needed) {
        const removed = result.pop();
        if (removed?.length) result[result.length - 1] = [...result[result.length - 1], ...removed];
      }
      return result;
    });
    setActiveDay((prev) => Math.min(prev, next));
  };

  const handleApplyPicked = (dayIndex: number, places: Place[]) => {
    setDays((prev) => prev.map((day, index) => (index === dayIndex ? places : day)));
    setStartIds((prev) => {
      if (prev[dayIndex] && places.some((place) => place.id === prev[dayIndex])) return prev;
      const { [dayIndex]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleRemove = (dayIndex: number, placeId: string) => {
    setDays((prev) =>
      prev.map((day, index) => (index === dayIndex ? day.filter((place) => place.id !== placeId) : day))
    );
    setStartIds((prev) => {
      if (prev[dayIndex] !== placeId) return prev;
      const { [dayIndex]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleGoReview = () => {
    const computed = days.map((day, index) => {
      const startId = startIds[index];
      const startIndex = startId ? day.findIndex((place) => place.id === startId) : 0;
      return nearestNeighborRoute(day, startIndex < 0 ? 0 : startIndex);
    });
    setReviewDays(computed);
    setReviewDay(0);
    setStep(2);
  };

  const handleMove = (dayIndex: number, from: number, direction: -1 | 1) => {
    setReviewDays((prev) => {
      const day = [...prev[dayIndex]];
      const to = from + direction;
      if (to < 0 || to >= day.length) return prev;
      [day[from], day[to]] = [day[to], day[from]];
      const next = [...prev];
      next[dayIndex] = day;
      return next;
    });
  };

  const handleSave = () => {
    const flat = reviewDays.flat();
    if (flat.length < 2) {
      showToast("최소 2곳이 필요해요");
      return;
    }
    const label = courseName.trim() || defaultCourseName();
    addCourse({
      label,
      nights,
      transport: "자차",
      source: "manual",
      shared: false,
      days: reviewDays.map((day) =>
        day.map((place) => ({
          placeId: place.id,
          name: place.name,
          category: place.category,
          district: place.district,
          condition: place.condition,
          petFriendly: place.petFriendly,
        }))
      ),
    });
    showToast("보관함에 저장했어요 🐾 날짜는 나중에!");
    router.push("/schedule");
  };

  return (
    <>
      <TopBar
        title={step === 0 ? "직접 짓기" : step === 1 ? "장소 담기" : "동선 확인"}
        showBack
        onBack={() => (step > 0 ? setStep(step - 1) : router.back())}
        rightSlot={step === 1 ? `${days.reduce((sum, d) => sum + d.length, 0)}곳` : undefined}
      />
      <CourseStepBar active={step} labels={MANUAL_STEP_LABELS} />

      {step === 0 ? <NightsStep nights={nights} onChangeNights={handleChangeNights} onNext={() => setStep(1)} /> : null}

      {step === 1 ? (
        <PlacesStep
          days={days}
          startIds={startIds}
          activeDay={activeDay}
          onSetActiveDay={setActiveDay}
          onSetStart={(dayIndex, placeId) => setStartIds((prev) => ({ ...prev, [dayIndex]: placeId }))}
          onRemove={handleRemove}
          onApplyPicked={handleApplyPicked}
          onNext={handleGoReview}
        />
      ) : null}

      {step === 2 ? (
        <ReviewStep
          days={reviewDays}
          activeDay={reviewDay}
          onSetActiveDay={setReviewDay}
          onMove={handleMove}
          name={courseName}
          onChangeName={setCourseName}
          defaultName={defaultCourseName()}
          onSave={handleSave}
        />
      ) : null}

      <PlacePickerSheet />
    </>
  );
}
