"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { CourseStepBar } from "@/components/course/CourseStepBar";
import { IntroStep } from "./steps/IntroStep";
import { QuestionStep } from "./steps/QuestionStep";
import { ResultStep } from "./steps/ResultStep";
import { ThemePickerStep } from "./steps/ThemePickerStep";
import { NightsStep } from "./steps/NightsStep";
import { ConditionsStep } from "./steps/ConditionsStep";
import { TransportStep } from "./steps/TransportStep";
import { GeneratedResultStep } from "./steps/GeneratedResultStep";
import { MBTI_QUESTIONS, scoreAnswers, type CourseTheme, type MbtiAnswer } from "@/lib/mbti";
import { chunkIntoDays } from "@/lib/chunkDays";
import { useCourseStore } from "@/stores/useCourseStore";
import { useToastStore } from "@/stores/useToastStore";
import { usePetTourSpots } from "@/hooks/usePetTourSpots";
import { ensureCategoryMinimum } from "@/lib/petTourMapper";
import { mockPlaces } from "@/mocks";
import type { Place, Transport } from "@/types";

type Phase = "intro" | "quiz" | "result" | "theme" | "nights" | "conditions" | "transport" | "generated";

const GENERATE_STEP_LABELS = ["기간", "조건", "이동", "코스"] as const;
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
  const router = useRouter();
  const addCourse = useCourseStore((state) => state.addCourse);
  const showToast = useToastStore((state) => state.show);
  const { data: apiPlaces } = usePetTourSpots();

  const [phase, setPhase] = useState<Phase>("intro");
  const [entryPath, setEntryPath] = useState<"quiz" | "theme">("quiz");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<MbtiAnswer[]>(() => Array(MBTI_QUESTIONS.length).fill(null));
  const [mbtiCode, setMbtiCode] = useState("");
  const [theme, setTheme] = useState<CourseTheme>("산책");
  const [nights, setNights] = useState(0);
  const [companion, setCompanion] = useState("나와 강아지");
  const [budget, setBudget] = useState("3~7만원");
  const [season, setSeason] = useState("여름");
  const [transport, setTransport] = useState<Transport>("자차");
  const [generatedDays, setGeneratedDays] = useState<Place[][]>([]);

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
      setMbtiCode(scoreAnswers(next));
      setPhase("result");
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const goNightsFrom = (chosenTheme: CourseTheme, from: "quiz" | "theme") => {
    setTheme(chosenTheme);
    setEntryPath(from);
    setNights(0);
    setPhase("nights");
  };

  const handleGenerate = () => {
    const source = ensureCategoryMinimum(apiPlaces ?? [], mockPlaces, MIN_PER_CATEGORY);
    setGeneratedDays(generateCourseDays(theme, nights, source));
    setPhase("generated");
  };

  const handleSave = () => {
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
        }))
      ),
    });
    showToast("보관함에 저장했어요 🐾 날짜는 나중에!");
    router.push("/schedule");
  };

  const stepBarActive = ["nights", "conditions", "transport", "generated"].indexOf(phase);

  const titleByPhase: Record<Phase, string> = {
    intro: "반려동물 여행 MBTI",
    quiz: "반려동물 여행 MBTI",
    result: "테스트 결과",
    theme: "테마 고르기",
    nights: `${theme}형 코스`,
    conditions: `${theme}형 코스`,
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
      case "theme":
        setPhase("intro");
        return;
      case "nights":
        setPhase(entryPath === "quiz" ? "result" : "theme");
        return;
      case "conditions":
        setPhase("nights");
        return;
      case "transport":
        setPhase("conditions");
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

      {phase === "intro" ? (
        <IntroStep onStart={startQuiz} onSkipToTheme={() => setPhase("theme")} />
      ) : null}

      {phase === "quiz" ? (
        <QuestionStep
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
        <ResultStep
          code={mbtiCode}
          onContinue={(chosenTheme) => goNightsFrom(chosenTheme, "quiz")}
          onRetake={startQuiz}
        />
      ) : null}

      {phase === "theme" ? (
        <ThemePickerStep onPick={(chosenTheme) => goNightsFrom(chosenTheme, "theme")} />
      ) : null}

      {phase === "nights" ? (
        <NightsStep theme={theme} nights={nights} onChangeNights={setNights} onNext={() => setPhase("conditions")} />
      ) : null}

      {phase === "conditions" ? (
        <ConditionsStep
          companion={companion}
          budget={budget}
          season={season}
          onChangeCompanion={setCompanion}
          onChangeBudget={setBudget}
          onChangeSeason={setSeason}
          onNext={() => setPhase("transport")}
        />
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
          companion={companion}
          budget={budget}
          transport={transport}
          days={generatedDays}
          courseTitle={COURSE_TITLES[theme]}
          onSave={handleSave}
          onGoHome={() => router.push("/home")}
        />
      ) : null}
    </>
  );
}
