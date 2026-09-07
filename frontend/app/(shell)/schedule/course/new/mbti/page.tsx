"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { CourseStepBar } from "@/components/course/CourseStepBar";
import { IntroStep } from "./steps/IntroStep";
import { QuestionStep } from "./steps/QuestionStep";
import { ResultStep } from "./steps/ResultStep";
import { NightsStep } from "./steps/NightsStep";
import { TransportStep } from "./steps/TransportStep";
import { GeneratedResultStep } from "./steps/GeneratedResultStep";
import { LoginModal } from "@/components/my/LoginModal";
import { MBTI_QUESTIONS, resolveMbtiType, scoreAnswers, topTheme, type CourseTheme, type MbtiAnswer } from "@/lib/mbti";
import { chunkIntoDays } from "@/lib/chunkDays";
import { resolvePlaceImageUrl } from "@/lib/courseFormat";
import { useCourseStore } from "@/stores/useCourseStore";
import { useToastStore } from "@/stores/useToastStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";
import { usePickablePlaces } from "@/hooks/usePickablePlaces";
import { ensureCategoryMinimum } from "@/lib/petTourMapper";
import { mockPlaces } from "@/mocks";
import type { Place, Transport } from "@/types";

type Phase = "intro" | "quiz" | "result" | "nights" | "transport" | "generated";

const GENERATE_STEP_LABELS = ["기간", "이동", "코스"] as const;
const MIN_PER_CATEGORY = 3;
const COURSE_TITLES: Record<CourseTheme, string> = {
  산책: "청량 힐링 산책 데이",
  맛집: "댕댕이랑 빵지순례 데이",
  문화: "호기심 가득 문화 나들이",
};

function generateCourseDays(theme: CourseTheme, nights: number, source: Place[]): Place[][] {
  const count = Math.max(3, (nights + 1) * 2);
  const matched = source.filter((place) => place.category === theme);
  const rest = source.filter((place) => place.category !== theme);
  const byPetFriendlyThenName = (a: Place, b: Place) =>
    Number(b.petFriendly) - Number(a.petFriendly) || a.name.localeCompare(b.name);
  const list = [...matched.sort(byPetFriendlyThenName), ...rest.sort(byPetFriendlyThenName)].slice(0, count);
  return chunkIntoDays(list, nights + 1);
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
  const { data: apiPlaces } = usePickablePlaces();
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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<MbtiAnswer[]>(() => Array(MBTI_QUESTIONS.length).fill(null));
  const [mbtiCode, setMbtiCode] = useState(quickStart ? savedMbtiCode! : "");
  const [theme, setTheme] = useState<CourseTheme>("산책");
  const [nights, setNights] = useState(0);
  const [transport, setTransport] = useState<Transport>("자차");
  const [generatedDays, setGeneratedDays] = useState<Place[][]>([]);
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
    const source = ensureCategoryMinimum(apiPlaces ?? [], mockPlaces, MIN_PER_CATEGORY);
    setGeneratedDays(generateCourseDays(theme, nights, source));
    setPhase("generated");
  };

  const handleReorderDay = (dayIndex: number, nextDay: Place[]) => {
    setGeneratedDays((prev) => {
      const next = [...prev];
      next[dayIndex] = nextDay;
      return next;
    });
  };

  const handleSave = () => {
    if (!isLoggedIn) {
      setLoginOpen(true);
      return;
    }
    saveCourse();
  };

  const saveCourse = () => {
    const flat = generatedDays.flat();
    if (flat.length < 2) {
      showToast("추천할 장소가 부족해요");
      return;
    }
    addCourse({
      label: COURSE_TITLES[theme],
      nights,
      transport,
      source: "ai",
      shared: false,
      days: generatedDays.map((day) =>
        day.map((place) => ({
          placeId: place.id,
          name: place.name,
          category: place.category,
          district: place.district,
          condition: place.condition,
          petFriendly: place.petFriendly,
          imageUrl: resolvePlaceImageUrl(place),
        }))
      ),
    });
    showToast("보관함에 저장했어요 🐾 날짜는 나중에!");
    router.push("/schedule");
  };

  const stepBarActive = ["nights", "transport", "generated"].indexOf(phase);

  const titleByPhase: Record<Phase, string> = {
    intro: "반려동물 여행 MBTI",
    quiz: "반려동물 여행 MBTI",
    result: "테스트 결과",
    nights: `${theme}형 코스`,
    transport: `${theme}형 코스`,
    generated: `${theme}형 코스`,
  };

  const handleBack = () => {
    switch (phase) {
      case "quiz":
        if (currentQuestion > 0) setCurrentQuestion((prev) => prev - 1);
        else setPhase("intro");
        return;
      case "result":
        setPhase("intro");
        return;
      case "nights":
        setPhase("result");
        return;
      case "transport":
        setPhase("nights");
        return;
      case "generated":
        setPhase("transport");
        return;
      default:
        router.back();
    }
  };

  return (
    <>
      <TopBar title={titleByPhase[phase]} showBack={phase !== "quiz"} onBack={handleBack} />
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
        <NightsStep theme={theme} nights={nights} onChangeNights={setNights} onNext={() => setPhase("transport")} />
      ) : null}

      {phase === "transport" ? (
        <TransportStep
          onPick={(picked) => {
            setTransport(picked);
            handleGenerate();
          }}
        />
      ) : null}

      {phase === "generated" ? (
        <GeneratedResultStep
          theme={theme}
          nights={nights}
          transport={transport}
          days={generatedDays}
          courseTitle={COURSE_TITLES[theme]}
          onReorderDay={handleReorderDay}
          onSave={handleSave}
          onGoHome={() => router.push("/home")}
        />
      ) : null}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLoggedIn={saveCourse} />
    </>
  );
}
