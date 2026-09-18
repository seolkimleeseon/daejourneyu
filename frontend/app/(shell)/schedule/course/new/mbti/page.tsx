"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { CourseStepBar } from "@/components/course/CourseStepBar";
import { IntroStep } from "./steps/IntroStep";
import { QuestionStep } from "./steps/QuestionStep";
import { ResultStep } from "./steps/ResultStep";
import { NightsStep } from "./steps/NightsStep";
import { GeneratedResultStep } from "./steps/GeneratedResultStep";
import { LoginModal } from "@/components/my/LoginModal";
import { MBTI_QUESTIONS, resolveMbtiType, scoreAnswers, topTheme, type CourseTheme, type MbtiAnswer } from "@/lib/mbti";
import { placeToStop } from "@/lib/courseFormat";
import { useCourseStore } from "@/stores/useCourseStore";
import { useToastStore } from "@/stores/useToastStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";
import { usePickablePlaces } from "@/hooks/usePickablePlaces";
import { ensureCategoryMinimum, type PickablePlace } from "@/lib/petTourMapper";
import { routeDistanceKm, shortestRoute } from "@/lib/nearestNeighborRoute";
import { haversine } from "@/lib/haversine";
import { stashPendingCourseSave } from "@/lib/pendingCourseSave";
import { mockPlaces } from "@/mocks";
import type { Course, DaejeonDistrict, Place, PlaceCategory } from "@/types";

type Phase = "intro" | "quiz" | "result" | "nights" | "generated";

const GENERATE_STEP_LABELS = ["기간", "코스"] as const;
/** 직접짓기 위저드와 동일하게 이동수단 선택 단계를 없애고 자차로 고정한다. */
const DEFAULT_TRANSPORT = "자차" as const;
const MIN_PER_CATEGORY = 3;
const COURSE_TITLES: Record<CourseTheme, string> = {
  산책: "청량 힐링 산책 데이",
  맛집: "댕댕이랑 빵지순례 데이",
  문화: "호기심 가득 문화 나들이",
};

const ALL_CATEGORIES: PlaceCategory[] = ["산책", "놀이터", "맛집", "문화"];
const ALL_DISTRICTS: DaejeonDistrict[] = ["유성구", "중구", "동구", "대덕구", "서구"];

type SourcePlace = Place | PickablePlace;

/** backend가 매긴 소스 신뢰도(1=식약처·관광공사 등 인증 소스, 2=공공데이터 미인증). mockPlaces처럼
 * 신뢰도 정보가 없는 폴백 데이터는 미인증과 동급(2)으로 취급한다. */
function getSourceTier(place: SourcePlace): number {
  return "sourceTier" in place && typeof place.sourceTier === "number" ? place.sourceTier : 2;
}

const MAX_ANCHOR_DISTANCE_KM = 8;
const MAX_DAY_ROUTE_KM = 16;
const MAX_LEG_KM = 10;

function isCompactRoute(places: SourcePlace[]): boolean {
  const route = shortestRoute(places);
  return routeDistanceKm(route) <= MAX_DAY_ROUTE_KM &&
    route.every((place, index) => index === 0 || haversine(route[index - 1], place) <= MAX_LEG_KM);
}

/** Fisher–Yates. 배열을 무작위로 섞어 새 배열을 반환한다(원본은 건드리지 않는다). */
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 밥 먹을 곳을 중심으로 하루 이동 반경을 잡고, 테마·아직 못 간 카테고리를 채운다. */
function generateCourseDays(theme: CourseTheme, nights: number, source: SourcePlace[], variation = 0): SourcePlace[][] {
  const daysCount = nights + 1;
  const perDay = daysCount === 1 ? 4 : 3;

  const districtRichness = shuffle(ALL_DISTRICTS)
    .map((district) => ({
      district,
      themeCount: source.filter((place) => place.district === district && place.category === theme).length,
      totalCount: source.filter((place) => place.district === district).length,
    }))
    .sort((a, b) => b.themeCount - a.themeCount || b.totalCount - a.totalCount);

  // 재추천 시 첫 지역도 바꾼다. 식사 장소가 없는 지역은 하루 동선의 중심으로 쓰지 않는다.
  const viableDistricts = districtRichness.filter(({ district }) => {
    const places = source.filter((place) => place.district === district);
    return places.some((place) => place.category === "맛집") && places.length >= 2;
  });
  const districtOptions = viableDistricts.length > 0 ? viableDistricts : districtRichness.filter(({ totalCount }) => totalCount > 0);
  if (districtOptions.length === 0) return Array.from({ length: daysCount }, () => []);
  const assignedDistricts = Array.from(
    { length: daysCount },
    (_, i) => districtOptions[(i + variation) % districtOptions.length].district
  );

  const usedIds = new Set<string>();
  const coveredCategories = new Set<PlaceCategory>();
  return assignedDistricts.map((district) => {
    const available = source.filter((place) => !usedIds.has(place.id));
    const localRestaurants = shuffle(available.filter((place) => place.district === district && place.category === "맛집"));
    const restaurants = localRestaurants.length > 0 ? localRestaurants : shuffle(available.filter((place) => place.category === "맛집"));
    // 같은 구 안에서도 외곽 장소끼리 멀 수 있다. 주변 카테고리를 많이 담는 식당을 중심으로 고른다.
    const anchors = restaurants.sort((a, b) => {
      const coverage = (restaurant: SourcePlace) => new Set(available.filter(
        (place) => haversine(restaurant, place) <= MAX_ANCHOR_DISTANCE_KM
      ).map((place) => place.category)).size;
      return coverage(b) - coverage(a) || getSourceTier(a) - getSourceTier(b);
    });
    const anchor = anchors[0];
    if (!anchor) return [];

    const nearby = shuffle(available.filter((place) =>
      place.id !== anchor.id && haversine(anchor, place) <= MAX_ANCHOR_DISTANCE_KM
    ));
    const picked: SourcePlace[] = [anchor];
    const otherCategories = ALL_CATEGORIES.filter((category) => category !== "맛집" && category !== theme);
    const categoryOrder: PlaceCategory[] = [
      ...(theme === "맛집" ? [] : [theme]),
      ...otherCategories.filter((category) => !coveredCategories.has(category)),
      ...otherCategories.filter((category) => coveredCategories.has(category)),
    ];
    for (const category of categoryOrder) {
      if (picked.length >= perDay) break;
      const options = nearby.filter((place) => place.category === category && !picked.some((item) => item.id === place.id))
        .sort((a, b) => getSourceTier(a) - getSourceTier(b) || haversine(anchor, a) - haversine(anchor, b));
      const next = options.find((place) => isCompactRoute([...picked, place]));
      if (next) picked.push(next);
    }
    if (picked.length < perDay) {
      const remaining = nearby.filter((place) => !picked.some((item) => item.id === place.id))
        .sort((a, b) => haversine(anchor, a) - haversine(anchor, b));
      for (const place of remaining) {
        if (picked.length >= perDay) break;
        if (isCompactRoute([...picked, place])) picked.push(place);
      }
    }
    picked.forEach((place) => {
      usedIds.add(place.id);
      coveredCategories.add(place.category);
    });
    return shortestRoute(picked);
  });
}

export default function MbtiCourseWizardPage() {
  return (
    <Suspense fallback={null}>
      <MbtiCourseWizard />
    </Suspense>
  );
}

function MbtiCourseWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addCourse = useCourseStore((state) => state.addCourse);
  const showToast = useToastStore((state) => state.show);
  const { data: apiPlaces, isLoading: placesLoading } = usePickablePlaces();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const activePet = usePetStore((state) => state.activePet());
  const saveMbti = usePetStore((state) => state.saveMbti);
  // 검사 결과는 반려동물에 저장된다 — 다시 들어와도(새로고침해도) 그대로 남아 있어야 한다.
  const savedMbtiCode = activePet?.mbti?.code ?? null;

  // 로그인 상태에서 저장된 MBTI 결과가 있고, "MBTI 맞춤 코스" 타일에서 바로가기로 들어온 경우엔
  // 인트로/퀴즈 단계를 건너뛰고 바로 저장된 결과 화면부터 보여준다. 거기서 "이 성향으로 코스
  // 만들기"를 눌러야 코스 생성(기간→이동→코스)으로 넘어간다.
  // 로그인 안 했거나 저장된 결과가 없으면(=quick이어도) 평소와 똑같이 인트로부터 시작한다.
  const quickStart = searchParams.get("quick") === "1" && isLoggedIn && !!savedMbtiCode;

  const [phase, setPhase] = useState<Phase>(quickStart ? "result" : "intro");
  // quickStart로 곧장 결과부터 보여준 경우엔 이번 세션에 퀴즈를 실제로 푼 적이 없으므로,
  // 결과 화면에서 뒤로가기를 누르면 인트로/퀴즈로 보내지 않고 바로 이전 화면(내 여정)으로 나간다.
  const [resultFromQuiz, setResultFromQuiz] = useState(!quickStart);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<MbtiAnswer[]>(() => Array(MBTI_QUESTIONS.length).fill(null));
  const [mbtiCode, setMbtiCode] = useState(quickStart ? savedMbtiCode! : "");
  const [theme, setTheme] = useState<CourseTheme>("산책");
  const [nights, setNights] = useState(0);
  const [generatedDays, setGeneratedDays] = useState<Place[][]>([]);
  const [generationIndex, setGenerationIndex] = useState(0);
  const firstDayRestaurant = generatedDays[0]?.find((place) => place.category === "맛집");
  const generatedTitle = firstDayRestaurant
    ? `${firstDayRestaurant.district} ${COURSE_TITLES[theme]}`
    : COURSE_TITLES[theme];
  const [loginOpen, setLoginOpen] = useState(false);

  const startQuiz = () => {
    setAnswers(Array(MBTI_QUESTIONS.length).fill(null));
    setCurrentQuestion(0);
    setPhase("quiz");
  };

  const advanceQuestion = (answer: MbtiAnswer) => {
    const next = [...answers];
    next[currentQuestion] = answer;
    setAnswers(next);
    if (currentQuestion + 1 >= MBTI_QUESTIONS.length) {
      const code = scoreAnswers(next);
      setMbtiCode(code);
      void persistMbti(code);
      setResultFromQuiz(true);
      setPhase("result");
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  /**
   * 검사 결과를 활성 반려동물에 저장한다.
   * 로그인 전이거나 등록된 반려동물이 없으면 저장할 대상이 없으므로 화면 흐름만 이어간다 —
   * 이 경우 결과는 이번 코스 만들기에만 쓰이고 남지 않는다.
   */
  const persistMbti = async (code: string) => {
    if (!isLoggedIn || !activePet) return;

    const type = resolveMbtiType(code);
    const result = await saveMbti(activePet.id, {
      code: type.code,
      name: type.name,
      theme: topTheme(type),
      traits: type.traits,
    });
    if (!result.ok) showToast(result.message ?? "여행 유형을 저장하지 못했어요");
  };

  const goNightsFrom = (chosenTheme: CourseTheme) => {
    setTheme(chosenTheme);
    setNights(0);
    setPhase("nights");
  };

  const handleGenerate = () => {
    // 동반 불가(petFriendly: false) 장소는 정렬에서 뒤로 밀릴 뿐 걸러지진 않아서, 후보가 적으면
    // 반려동물 동반 여행 코스에 동반 불가 장소가 뽑힐 수 있었다 — 후보 단계에서 아예 제외한다.
    const primary = (apiPlaces ?? []).filter((place) => place.petFriendly);
    const fallback = mockPlaces.filter((place) => place.petFriendly);
    const source = ensureCategoryMinimum(primary, fallback, MIN_PER_CATEGORY);
    setGeneratedDays(generateCourseDays(theme, nights, source));
    setGenerationIndex(0);
    setPhase("generated");
  };

  const handleRegenerate = () => {
    const source = ensureCategoryMinimum(
      (apiPlaces ?? []).filter((place) => place.petFriendly),
      mockPlaces.filter((place) => place.petFriendly),
      MIN_PER_CATEGORY
    );
    const nextIndex = generationIndex + 1;
    setGenerationIndex(nextIndex);
    setGeneratedDays(generateCourseDays(theme, nights, source, nextIndex));
  };

  const handleReorderDay = (dayIndex: number, nextDay: Place[]) => {
    setGeneratedDays((prev) => {
      const next = [...prev];
      next[dayIndex] = nextDay;
      return next;
    });
  };

  const buildCoursePayload = (): Omit<Course, "id"> | null => {
    const flat = generatedDays.flat();
    if (generatedDays.length !== nights + 1 || generatedDays.some((day) => day.length < 2) || flat.length < 2) return null;
    return {
      label: generatedTitle,
      nights,
      transport: DEFAULT_TRANSPORT,
      source: "ai",
      shared: false,
      days: generatedDays.map((day) => day.map(placeToStop)),
    };
  };

  const handleSave = () => {
    const payload = buildCoursePayload();
    if (!payload) {
      showToast("추천할 장소가 부족해요");
      return;
    }
    if (!isLoggedIn) {
      // 로그인하러 나가면 이 위저드의 상태는 사라진다(카카오 로그인은 외부 사이트를 거쳐 페이지가
      // 새로고침된다) — 지금 만든 코스를 맡겨두고 로그인 완료 후 AuthHydrator가 대신 저장한다.
      stashPendingCourseSave(payload);
      setLoginOpen(true);
      return;
    }
    saveCourse();
  };

  const saveCourse = () => {
    const payload = buildCoursePayload();
    if (!payload) {
      showToast("추천할 장소가 부족해요");
      return;
    }
    addCourse(payload);
    showToast("보관함에 저장했어요 🐾 날짜는 나중에!");
    router.push("/schedule");
  };

  const stepBarActive = ["nights", "generated"].indexOf(phase);

  const titleByPhase: Record<Phase, string> = {
    intro: "반려동물 여행 MBTI",
    quiz: "반려동물 여행 MBTI",
    result: "테스트 결과",
    nights: `${theme}형 코스`,
    generated: `${theme}형 코스`,
  };

  const handleBack = () => {
    switch (phase) {
      // 퀴즈 문항 하나씩 되돌아가는 건 QuestionStep 안의 "‹ 이전 질문" 버튼이 따로 맡고 있다 —
      // 상단 뒤로가기는 검사 도중에도 언제든 내 여정 탭으로 바로 나갈 수 있어야 해서 기본
      // 동작(default: router.back())으로 흘려보낸다.
      case "result":
        if (resultFromQuiz) {
          setPhase("intro");
        } else {
          router.back();
        }
        return;
      case "nights":
        setPhase("result");
        return;
      case "generated":
        setPhase("nights");
        return;
      default:
        router.back();
    }
  };

  return (
    <>
      <TopBar title={titleByPhase[phase]} showBack onBack={handleBack} />
      {stepBarActive >= 0 ? <CourseStepBar active={stepBarActive} labels={GENERATE_STEP_LABELS} /> : null}

      {phase === "intro" ? <IntroStep onStart={startQuiz} /> : null}

      {phase === "quiz" ? (
        <QuestionStep
          key={currentQuestion}
          question={MBTI_QUESTIONS[currentQuestion]}
          index={currentQuestion}
          total={MBTI_QUESTIONS.length}
          selected={answers[currentQuestion]}
          onSelect={advanceQuestion}
          onBack={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          onSkip={() => advanceQuestion(null)}
          canGoBack={currentQuestion > 0}
        />
      ) : null}

      {phase === "result" ? (
        <ResultStep code={mbtiCode} onContinue={(chosenTheme) => goNightsFrom(chosenTheme)} onRetake={startQuiz} />
      ) : null}

      {phase === "nights" ? (
        <NightsStep
          theme={theme}
          nights={nights}
          onChangeNights={setNights}
          onNext={handleGenerate}
          placesLoading={placesLoading}
        />
      ) : null}

      {phase === "generated" ? (
        <GeneratedResultStep
          theme={theme}
          nights={nights}
          transport={DEFAULT_TRANSPORT}
          days={generatedDays}
          courseTitle={generatedTitle}
          onReorderDay={handleReorderDay}
          onRegenerate={handleRegenerate}
          onSave={handleSave}
          onGoHome={() => router.push("/home")}
        />
      ) : null}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLoggedIn={saveCourse} />
    </>
  );
}
