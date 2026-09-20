"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/shell/TopBar";
import { TabPlaceholder } from "@/components/shell/TabPlaceholder";
import { Tag } from "@/components/ui/Tag";
import { CourseButton as Button } from "@/components/course/CourseButton";
import { Modal } from "@/components/ui/Modal";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ResultShareActions } from "@/components/course/ResultShareActions";
import { CourseRouteMap } from "@/components/course/CourseRouteMap";
import { CourseShareCard } from "@/components/course/CourseShareCard";
import { PlacePickerSheet } from "@/components/course/PlacePickerSheet";
import { KakaoPlacePreviewSheet } from "@/components/course/KakaoPlacePreviewSheet";
import { StopThumbnail } from "@/components/course/StopThumbnail";
import { LoginRequiredGate } from "@/components/course/LoginRequiredGate";
import { Emoji3D } from "@/components/ui/Emoji3D";
import {
  conditionSourceLabel,
  isUnverifiedCondition,
  NEEDS_CHECK_LABEL,
  nightsLabel,
  placeToStop,
  resolveCourseEmoji,
  SOURCE_LABEL,
  SOURCE_TONE,
} from "@/lib/courseFormat";
import { cn } from "@/lib/cn";
import { useCourseStore } from "@/stores/useCourseStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSyncCoursesFromApi } from "@/hooks/useSyncCoursesFromApi";
import { useSheetStore } from "@/stores/useSheetStore";
import type { CourseStop } from "@/types";

/** 티켓 배경(브랜드 민트) 위에서도 태그 경계가 보이도록 배경을 흰색으로 고정한다 —
 * tone별 배경이 티켓 배경색과 같은 계열이면 경계가 안 보이는 문제 방지. 글자색은 tone 그대로 유지. */
const TICKET_TAG_CLASS = "cursor-default border border-line bg-card";

/** Emoji3D에 3D 렌더가 있는 것만 골랐다 — 매핑 안 된 이모지는 OS 기본 폰트로 그려져서
 * Windows/Mac에서 모양이 달라 보인다(예: 윈도우 vs 맥 이모지 폰트 차이). */
const EMOJI_CHOICES = [
  "🐾", "🐶", "🐕", "🐩", "🦮", "🦴",
  "🌳", "🌸", "🌈", "🌙", "⭐", "🎈",
  "🎾", "🥾", "🏛️", "🎯", "🎨", "🎉",
  "🍖", "🥐", "📍", "🗺️", "🏠", "🎒",
];

export default function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  useSyncCoursesFromApi();
  const courses = useCourseStore((state) => state.courses);
  const courseIdAliases = useCourseStore((state) => state.courseIdAliases);
  const hasSynced = useCourseStore((state) => state.hasSynced);
  const updateCourse = useCourseStore((state) => state.updateCourse);
  const deleteCourse = useCourseStore((state) => state.deleteCourse);
  const schedules = useCourseStore((state) => state.schedules);
  const resolvedCourseId = courseIdAliases[params.courseId] ?? params.courseId;
  const course = courses.find((item) => item.id === resolvedCourseId);
  const courseSchedules = schedules
    .filter((item) => item.courseId === resolvedCourseId)
    .sort((a, b) => a.date.localeCompare(b.date));

  useEffect(() => {
    if (resolvedCourseId !== params.courseId) {
      router.replace(`/schedule/course/${resolvedCourseId}`);
    }
  }, [params.courseId, resolvedCourseId, router]);

  const shareCardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeDay, setActiveDay] = useState(0);

  const [editMode, setEditMode] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftEmoji, setDraftEmoji] = useState<string | null>(null);
  const [draftDays, setDraftDays] = useState<CourseStop[][]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [kakaoPreview, setKakaoPreview] = useState<CourseStop | null>(null);
  const openPlaceSheet = useSheetStore((state) => state.open);

  if (!isLoggedIn) {
    return (
      <>
        <TopBar title="코스 상세" showBack />
        <LoginRequiredGate message="저장된 코스는 로그인해야 볼 수 있어요" />
      </>
    );
  }

  if (!course) {
    // 로그인 직후엔 courses가 아직 mockCourses(초기값)일 수 있어, 실제로 존재하는 코스인데도
    // 서버 목록이 도착하기 전이라 "찾을 수 없음"으로 오판할 수 있다 — 동기화가 끝난 뒤에만 진짜로 없다고 안내한다.
    if (!hasSynced) {
      return (
        <>
          <TopBar title="코스 상세" showBack />
          <div className="py-16 text-center text-xs text-ink-muted">불러오는 중…</div>
        </>
      );
    }
    return (
      <>
        <TopBar title="코스 상세" showBack />
        <TabPlaceholder icon3D emoji="🐾" message={"코스를 찾을 수 없어요\n삭제되었거나 접근할 수 없는 코스예요"} />
      </>
    );
  }

  const displayDays = editMode ? draftDays : course.days;
  const displayLabel = editMode ? draftLabel : course.label;
  const displayEmoji = editMode ? draftEmoji || resolveCourseEmoji(null, course.source) : resolveCourseEmoji(course.emoji, course.source);
  const stopCount = displayDays.reduce((sum, day) => sum + day.length, 0);
  const isMultiDay = displayDays.length > 1;

  const goToPlace = (stop: CourseStop) => {
    // 카카오맵 검색으로 담긴 장소는 /api/places·mockPlaces에 없어 우리 상세 페이지 조회가 항상
    // 실패한다 — 대신 같은 앱 안에서 우리 상세 페이지와 비슷한 생김새의 미리보기 시트를 띄운다.
    // 지도는 KakaoPlacePreviewSheet 안에서 CourseRouteMap이 그때그때 좌표를 다시 구해서 그리므로
    // placeUrl 유무와 무관하게(예전에 저장된 코스도) 항상 뜬다 — "카카오맵에서 보기" 버튼만
    // placeUrl이 있을 때 추가로 보인다.
    if (stop.placeId.startsWith("kakao-")) {
      setKakaoPreview(stop);
      return;
    }
    router.push(`/place/${encodeURIComponent(stop.name)}`);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveDay(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goToDay = (index: number) => {
    scrollRef.current?.scrollTo({ left: index * (scrollRef.current?.clientWidth ?? 0), behavior: "smooth" });
    setActiveDay(index);
  };

  const enterEditMode = () => {
    setDraftLabel(course.label);
    setDraftEmoji(course.emoji ?? null);
    setDraftDays(course.days.map((day) => day.map((stop) => ({ ...stop }))));
    setEditMode(true);
  };

  const cancelEditMode = () => setEditMode(false);

  const saveEditMode = () => {
    // 하루라도 장소가 0곳이면 저장을 막는다 — 개별 삭제 버튼은 마지막 1곳을 못 지우게 막아두지만,
    // 그 방어선과 별개로 저장 시점에도 한 번 더 확인한다.
    if (draftLabel.trim().length === 0 || draftDays.some((day) => day.length === 0)) return;
    // 백엔드 반영이 끝난 뒤에야 캐시를 무효화한다 — 그 전에 무효화하면 아직 수정 전 값을 든
    // 서버 응답이 캐시를 다시 채워서, 보관함으로 돌아갔을 때 방금 고친 이모지·이름이 잠깐(또는
    // 새로고침 전까지) 원래대로 보이는 문제가 생긴다.
    updateCourse(course.id, { label: draftLabel.trim(), emoji: draftEmoji, days: draftDays })
      .then(() => queryClient.invalidateQueries({ queryKey: ["courses"] }))
      .catch(() => {});
    setEditMode(false);
  };

  const reorderDay = (dayIndex: number, nextDay: CourseStop[]) => {
    setDraftDays((prev) => {
      const next = [...prev];
      next[dayIndex] = nextDay;
      return next;
    });
  };

  const removeStop = (dayIndex: number, index: number) => {
    setDraftDays((prev) => {
      if (prev[dayIndex].length <= 1) return prev; // 일차당 최소 1곳은 남긴다
      const next = [...prev];
      next[dayIndex] = prev[dayIndex].filter((_, i) => i !== index);
      return next;
    });
  };

  const addPlacesToDay = (dayIndex: number) => {
    openPlaceSheet({
      title: displayDays.length > 1 ? `${dayIndex + 1}일차에 장소 추가` : "장소 추가",
      initialSelected: [],
      onDone: (picked) => {
        if (picked.length === 0) return;
        setDraftDays((prev) => {
          const existingIds = new Set(prev[dayIndex].map((stop) => stop.placeId));
          const toAdd = picked.filter((place) => !existingIds.has(place.id)).map(placeToStop);
          if (toAdd.length === 0) return prev;
          const next = [...prev];
          next[dayIndex] = [...prev[dayIndex], ...toAdd];
          return next;
        });
      },
    });
  };

  const handleDelete = () => {
    deleteCourse(course.id);
    router.replace("/schedule/vault");
  };

  return (
    <>
      <TopBar title={editMode ? "코스 편집" : course.label} showBack onBack={editMode ? cancelEditMode : undefined} />

      <div className="px-4 pb-3 pt-3">
        {/* 여행 티켓 카드 — 상단 탑승권 스트립 + 절취선(펀치홀) + 일차 스탬프 */}
        <div className="overflow-hidden rounded-2xl bg-brand-100 shadow-sm">
          <div className="flex items-center justify-between px-4 pt-3 font-mono text-[9px] font-bold tracking-widest text-brand-700/70">
            <span>COURSE TICKET</span>
            <span>DAEJEON</span>
          </div>

          <div className="px-4 pb-3 pt-2 text-center">
            <Emoji3D emoji={displayEmoji} size={48} className="mx-auto" />
            {editMode ? (
              <button
                type="button"
                onClick={() => setEmojiPickerOpen(true)}
                className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-brand-300 bg-card px-2.5 py-1 text-[11px] font-semibold text-brand-700"
              >
                <Emoji3D emoji="🎨" size={14} shadow={false} />대표 이모지 바꾸기
              </button>
            ) : null}

            {editMode ? (
              <input
                value={draftLabel}
                onChange={(event) => setDraftLabel(event.target.value)}
                className="mt-2.5 w-full rounded-lg border border-brand-300 bg-card px-3 py-2 text-center text-base font-extrabold tracking-tight text-brand-700 outline-none"
                placeholder="코스 이름"
              />
            ) : (
              <div className="mt-1 text-base font-extrabold tracking-tight text-brand-700">{displayLabel}</div>
            )}

            <div className="mt-2 flex flex-wrap justify-center gap-1">
              <Tag tone={SOURCE_TONE[course.source]} className={TICKET_TAG_CLASS}>
                {SOURCE_LABEL[course.source]}
              </Tag>
              <Tag tone="brand" className={TICKET_TAG_CLASS}>
                {course.nights > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Emoji3D emoji="🌙" size={14} shadow={false} className="shrink-0" />
                    {nightsLabel(course.nights)}
                  </span>
                ) : (
                  `☀️ ${nightsLabel(course.nights)}`
                )}
              </Tag>
              {course.shared ? (
                <Tag tone="amber" className={TICKET_TAG_CLASS}>
                  🔗 공유됨
                </Tag>
              ) : null}
            </div>

            {courseSchedules.length > 0 ? (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {courseSchedules.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-1 rounded-xl bg-card px-3 py-2 text-xs font-semibold text-brand-700"
                  >
                    <Emoji3D emoji="📅" size={14} shadow={false} />
                    {s.date}에 가기로 했어요
                    {s.festivalTitles.length > 0 ? ` · ${s.festivalTitles.join(", ")}` : ""}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative mx-3.5 h-0 border-t border-dashed border-brand-700/25">
            <span className="absolute -left-[22px] -top-2 h-4 w-4 rounded-full bg-surface" />
            <span className="absolute -right-[22px] -top-2 h-4 w-4 rounded-full bg-surface" />
          </div>

          {isMultiDay ? (
            <>
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={cn(
                  "flex overflow-x-auto scroll-smooth no-scrollbar",
                  !editMode && "snap-x snap-mandatory"
                )}
              >
                {displayDays.map((day, dayIndex) => (
                  <div key={dayIndex} className="w-full shrink-0 snap-center px-4 py-3">
                    <DayStops
                      day={day}
                      dayIndex={dayIndex}
                      showMap={dayIndex === activeDay}
                      totalDays={displayDays.length}
                      onStopClick={goToPlace}
                      editMode={editMode}
                      onReorderDay={(nextDay) => reorderDay(dayIndex, nextDay)}
                      onRemove={(index) => removeStop(dayIndex, index)}
                      onAddPlace={() => addPlacesToDay(dayIndex)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-1.5 pb-3">
                {displayDays.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`${index + 1}일차 보기`}
                    onClick={() => goToDay(index)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === activeDay ? "w-4 bg-brand-700" : "w-1.5 bg-brand-700/30"
                    )}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="px-4 py-3">
              <DayStops
                day={displayDays[0] ?? []}
                dayIndex={0}
                showMap
                totalDays={1}
                onStopClick={goToPlace}
                editMode={editMode}
                onReorderDay={(nextDay) => reorderDay(0, nextDay)}
                onRemove={(index) => removeStop(0, index)}
                onAddPlace={() => addPlacesToDay(0)}
              />
            </div>
          )}
        </div>

        {editMode ? (
          <>
            <Button className="mt-3" onClick={saveEditMode}>
              <span>💾</span>저장하기
            </Button>
            <div className="mt-2 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={cancelEditMode}>
                취소
              </Button>
              <Button
                variant="secondary"
                className="flex-1 text-accent-coral"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <span>🗑️</span>삭제
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button className="mt-3" onClick={() => router.push(`/schedule/course/${course.id}/schedule`)}>
              {courseSchedules.length > 0 ? (
                <>
                  <span>📅</span>일정 관리하기
                </>
              ) : (
                <>
                  <span>📅</span>일정 추가하기
                </>
              )}
            </Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={enterEditMode}>
                <span>✏️</span>코스 내용 편집
              </Button>
              {course.source !== "saved" && !course.shared ? (
                <Button variant="secondary" onClick={() => router.push(`/schedule/course/${course.id}/share`)}>
                  <span>🧭</span>둘러보기에 공유
                </Button>
              ) : (
                <span />
              )}
              <ResultShareActions
                className="contents"
                captureRef={shareCardRef}
                fileName={`대저니유-${course.label}`}
                kakaoTitle={course.label}
                kakaoDescription={`${nightsLabel(course.nights)} · ${stopCount}곳 · 대저니유에서 만든 반려동물 여행 코스예요 🐾`}
                path={`/schedule/course/${course.id}`}
              />
            </div>
          </>
        )}
      </div>

      {/* 저장/공유용 캡처 전용 카드 — 화면엔 안 보이고 이미지 저장·카카오 공유할 때만 쓰인다.
          화면의 티켓을 그대로 캡처하면 실패한다: 안에 든 카카오 지도 타일과 장소 사진이 CORS를
          허용하지 않아, html-to-image가 그 이미지를 못 가져오는 순간 캡처 전체가 엎어진다. */}
      <div style={{ position: "fixed", top: 0, left: -9999 }} aria-hidden="true">
        <div ref={shareCardRef}>
          <CourseShareCard
            title={course.label}
            tags={[nightsLabel(course.nights), SOURCE_LABEL[course.source]]}
            days={displayDays}
          />
        </div>
      </div>

      <PlacePickerSheet />
      <KakaoPlacePreviewSheet stop={kakaoPreview} onClose={() => setKakaoPreview(null)} />

      <BottomSheet open={emojiPickerOpen} onClose={() => setEmojiPickerOpen(false)} title="대표 이모지 고르기">
        <div className="grid grid-cols-6 gap-2">
          {EMOJI_CHOICES.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={emoji}
              onClick={() => {
                setDraftEmoji(emoji);
                setEmojiPickerOpen(false);
              }}
              className={cn(
                "flex h-11 items-center justify-center rounded-xl text-2xl",
                draftEmoji === emoji ? "bg-brand-100 ring-2 ring-brand" : "bg-surface"
              )}
            >
              <Emoji3D emoji={emoji} size={24} shadow={false} />
            </button>
          ))}
        </div>
      </BottomSheet>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        emoji="🗑️"
        title="이 코스를 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요"
      >
        <Button variant="primary" className="bg-accent-coral active:bg-accent-coral" onClick={handleDelete}>
          삭제하기
        </Button>
        <Button variant="text" onClick={() => setDeleteConfirmOpen(false)}>
          취소
        </Button>
      </Modal>
    </>
  );
}

function DayStops({
  day,
  dayIndex,
  showMap,
  totalDays,
  onStopClick,
  editMode,
  onReorderDay,
  onRemove,
  onAddPlace,
}: {
  day: CourseStop[];
  dayIndex: number;
  showMap: boolean;
  totalDays: number;
  onStopClick: (stop: CourseStop) => void;
  editMode: boolean;
  onReorderDay: (nextDay: CourseStop[]) => void;
  onRemove: (index: number) => void;
  onAddPlace: () => void;
}) {
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handlePointerDown = (placeId: string) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDraggingId(placeId);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggingId) return;
    const pointerY = event.clientY;
    const currentIndex = day.findIndex((s) => s.placeId === draggingId);
    if (currentIndex === -1) return;
    for (let i = 0; i < day.length; i++) {
      if (i === currentIndex) continue;
      const el = rowRefs.current[day[i].placeId];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const crossing = (i < currentIndex && pointerY < mid) || (i > currentIndex && pointerY > mid);
      if (crossing) {
        const next = [...day];
        const [moved] = next.splice(currentIndex, 1);
        next.splice(i, 0, moved);
        onReorderDay(next);
        break;
      }
    }
  };

  const handlePointerUp = () => setDraggingId(null);

  return (
    <div>
      <div className="mb-2 flex items-center gap-1 text-xs font-bold text-brand-700">
        <Emoji3D emoji="📍" size={14} shadow={false} />
        {totalDays > 1 ? `${dayIndex + 1}일차 동선` : "동선"} · {day.length}곳
      </div>
      {!editMode && showMap ? <CourseRouteMap stops={day} /> : null}
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {day.map((stop, stopIndex) => (
          <div
            key={stop.placeId}
            ref={(el) => {
              rowRefs.current[stop.placeId] = el;
            }}
            className={cn(
              "flex items-center gap-2.5 border-b border-line px-4 py-3 last:border-b-0",
              draggingId === stop.placeId && "relative z-10 bg-brand-100"
            )}
            onClick={editMode ? undefined : () => onStopClick(stop)}
          >
            {editMode ? (
              <button
                type="button"
                onPointerDown={handlePointerDown(stop.placeId)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="flex h-9 w-6 shrink-0 touch-none items-center justify-center text-base text-ink-muted"
                aria-label="순서 바꾸기(드래그)"
              >
                ⠿
              </button>
            ) : null}
            <StopThumbnail category={stop.category} placeId={stop.placeId} imageUrl={stop.imageUrl} badge={stopIndex + 1} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-ink">{stop.name}</div>
              <div className="mt-0.5 text-xs text-ink-muted">
                {stop.district} · {stop.category}
              </div>
              {!editMode ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {/* "확인해주세요" 류 비확정 안내(카카오·공공데이터 tier2)는 확정형 동반가능
                      배지와 같이 두면 서로 모순돼 보인다 — 이 경우엔 출처 태그 + 표준 안내 태그
                      두 개로 짧게 보여준다(원문은 소스마다 길이가 다 달라 그대로 쓰면 너무 길다). */}
                  {isUnverifiedCondition(stop.condition) ? (
                    <>
                      <Tag tone="neutral" className="cursor-default px-2 py-1 text-[10px]">
                        {conditionSourceLabel(stop.condition)}
                      </Tag>
                      <Tag tone="neutral" className="cursor-default px-2 py-1 text-[10px]">
                        {NEEDS_CHECK_LABEL}
                      </Tag>
                    </>
                  ) : (
                    <>
                      <Tag
                        tone={stop.petFriendly ? "brand" : "coral"}
                        className="flex cursor-default items-center gap-0.5 px-2 py-1 text-[10px]"
                      >
                        {stop.petFriendly ? (
                          <>
                            <Emoji3D emoji="🐾" size={10} shadow={false} />동반 가능
                          </>
                        ) : (
                          "🚫 동반 불가"
                        )}
                      </Tag>
                      {/* 식약처·문체부처럼 실제로 확정된 소스도 원문 조건이 길면(대표메뉴·견종 제한 등
                          세부사항까지 다 붙어서) 카드 한 줄에 넘친다 — 출처만 짧게 보여준다. */}
                      <Tag tone="neutral" className="cursor-default px-2 py-1 text-[10px]">
                        {conditionSourceLabel(stop.condition)}
                      </Tag>
                    </>
                  )}
                </div>
              ) : null}
            </div>
            {editMode ? (
              <button
                type="button"
                disabled={day.length <= 1}
                onClick={() => onRemove(stopIndex)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-coral-light text-xs text-accent-coral disabled:opacity-30"
              >
                ✕
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {editMode ? (
        <button
          type="button"
          onClick={onAddPlace}
          className="mt-2.5 flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-card text-sm font-bold text-brand-700 active:bg-brand-100"
        >
          <span>➕</span>장소 추가하기
        </button>
      ) : null}
    </div>
  );
}
