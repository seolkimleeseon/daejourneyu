import type { PlaceCategory } from "@/types";

/** 코스 추천 테마로 쓰는 장소 카테고리 (놀이터·숙박은 추천 테마에서 제외) */
export type CourseTheme = Extract<PlaceCategory, "산책" | "맛집" | "문화">;

export type MbtiAxisLetter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";
export type MbtiAnswer = MbtiAxisLetter | "NEUTRAL" | null;

interface MbtiOption {
  label: string;
  sub: string;
  letter: MbtiAxisLetter;
  emoji: string;
}

export interface MbtiQuestion {
  axis: "EI" | "SN" | "TF" | "JP";
  tag: string;
  emoji: string;
  question: string;
  optionA: MbtiOption;
  optionB: MbtiOption;
}

export const MBTI_QUESTIONS: MbtiQuestion[] = [
  {
    axis: "EI",
    tag: "사교성",
    emoji: "🐕",
    question: "새로운 사람을 만나면?",
    optionA: { label: "반갑게 다가가요", sub: "사교적", letter: "E", emoji: "🐕" },
    optionB: { label: "살짝 숨어있어요", sub: "미리내림", letter: "I", emoji: "🐈" },
  },
  {
    axis: "EI",
    tag: "사교성",
    emoji: "🐾",
    question: "다른 강아지를 만나면?",
    optionA: { label: "같이 놀고 다가가요", sub: "외향적", letter: "E", emoji: "🐾" },
    optionB: { label: "내 갈 길 가요", sub: "내향적", letter: "I", emoji: "🐶" },
  },
  {
    axis: "EI",
    tag: "사교성",
    emoji: "🏞️",
    question: "사람 많은 공원에 가면?",
    optionA: { label: "신나서 여기저기 인사해요", sub: "분위기 즐김", letter: "E", emoji: "🎉" },
    optionB: { label: "한적한 구석을 찾아요", sub: "조용함 선호", letter: "I", emoji: "🌳" },
  },
  {
    axis: "SN",
    tag: "탐험 성향",
    emoji: "🥾",
    question: "산책하다 갈림길이 나오면?",
    optionA: { label: "늘 가던 익숙한 길로 가요", sub: "안정적", letter: "S", emoji: "🌳" },
    optionB: { label: "안 가본 길로 가고 싶어해요", sub: "호기심", letter: "N", emoji: "🧭" },
  },
  {
    axis: "SN",
    tag: "탐험 성향",
    emoji: "🐩",
    question: "새로운 동네를 만나면?",
    optionA: { label: "익숙한 경계까지만 가요", sub: "익숙함 선호", letter: "S", emoji: "📍" },
    optionB: { label: "온 동네 다 탐색해요", sub: "새로움 선호", letter: "N", emoji: "🗺️" },
  },
  {
    axis: "SN",
    tag: "탐험 성향",
    emoji: "🗺️",
    question: "미지의 장소에 도착하면?",
    optionA: { label: "조심스럽게 천천히 살펴요", sub: "신중한 편", letter: "S", emoji: "⭐" },
    optionB: { label: "바로 온 동네 탐험을 시작해요", sub: "직진력 빠름", letter: "N", emoji: "✨" },
  },
  {
    axis: "TF",
    tag: "반응 표현 방식",
    emoji: "🥾",
    question: "산책하다 힘들어지면?",
    optionA: { label: "티 안 내고 묵묵히 걸어요", sub: "참는 편", letter: "T", emoji: "🐾" },
    optionB: { label: "바로 주인 옆에 앉아버려요", sub: "감정 표현 확실", letter: "F", emoji: "🥺" },
  },
  {
    axis: "TF",
    tag: "반응 표현 방식",
    emoji: "🐕‍🦺",
    question: "다른 강아지가 다가오면?",
    optionA: { label: "냄새부터 차분히 확인해요", sub: "침착한 편", letter: "T", emoji: "🧐" },
    optionB: { label: "반가움·경계심을 바로 드러내요", sub: "감정 즉각 표현", letter: "F", emoji: "😳" },
  },
  {
    axis: "TF",
    tag: "반응 표현 방식",
    emoji: "🦴",
    question: "원하는 걸 얻고 싶을 때는?",
    optionA: { label: "얌전히 앉아서 기다려요", sub: "차분한 어필", letter: "T", emoji: "🐕" },
    optionB: { label: "짖거나 애교로 적극 표현해요", sub: "적극적 어필", letter: "F", emoji: "🐶" },
  },
  {
    axis: "JP",
    tag: "루틴·활동 패턴",
    emoji: "⏰",
    question: "매일 산책 시간이 되면?",
    optionA: { label: "시간을 정확히 기억하고 재촉해요", sub: "루틴 중시", letter: "J", emoji: "📅" },
    optionB: { label: "그때그때 달라도 신경 안 써요", sub: "유연한 편", letter: "P", emoji: "😎" },
  },
  {
    axis: "JP",
    tag: "루틴·활동 패턴",
    emoji: "🎒",
    question: "처음 다른 산책 코스로 가면?",
    optionA: { label: "어색해하며 적응에 시간이 걸려요", sub: "익숙함 선호", letter: "J", emoji: "🤔" },
    optionB: { label: "오히려 더 신나서 잘 적응해요", sub: "변화에 유연", letter: "P", emoji: "🎉" },
  },
  {
    axis: "JP",
    tag: "루틴·활동 패턴",
    emoji: "🧸",
    question: "노는 방식을 보면?",
    optionA: { label: "정해진 장난감·규칙을 좋아해요", sub: "규칙적인 편", letter: "J", emoji: "⭐" },
    optionB: { label: "아무거나 즉흥적으로 갖고 놀아요", sub: "즉흥적인 편", letter: "P", emoji: "🪀" },
  },
];

export interface MbtiTypeInfo {
  code: string;
  emoji: string;
  name: string;
  desc: string;
  traits: string[];
  theme: Record<CourseTheme, number>;
}

const T: Record<string, Omit<MbtiTypeInfo, "code">> = {
  ISTJ: { emoji: "🦴", name: "우직한 산책 껌딱지", desc: "늘 가던 익숙한 코스를 정한 시간에 딱 맞춰 움직이는 원칙파예요.", traits: ["익숙함", "계획적", "조용함"], theme: { 산책: 70, 맛집: 15, 문화: 15 } },
  ISFJ: { emoji: "🐠", name: "우리 가족이 최고견", desc: "믿을 수 있는 익숙한 곳에서 조용히 다정하게 산책하는 편이에요.", traits: ["다정함", "익숙함", "조용함"], theme: { 산책: 60, 맛집: 25, 문화: 15 } },
  INFJ: { emoji: "🐾", name: "차분한 힐링 코스러", desc: "사람 적은 곳에서 조용히, 그날 기분 따라 산책로를 탐색해요.", traits: ["차분함", "즉흥적", "감성적"], theme: { 산책: 55, 맛집: 15, 문화: 30 } },
  INTJ: { emoji: "🧭", name: "나만의 코스 설계자", desc: "계획을 철저히 세우고, 익숙한 곳도 효율적으로 정복하는 전략가예요.", traits: ["계획적", "효율적", "조용함"], theme: { 산책: 35, 맛집: 15, 문화: 50 } },
  ISTP: { emoji: "🐕", name: "말 없는 탐구견", desc: "조용히 관찰하며 새로운 골목을 사부작사부작 탐색하는 편이에요.", traits: ["조용함", "효율적", "즉흥적"], theme: { 산책: 45, 맛집: 20, 문화: 35 } },
  ISFP: { emoji: "🌸", name: "느긋 감성견", desc: "익숙한 곳에서 기분 따라 자유롭게, 감성적인 산책을 좋아해요.", traits: ["감성적", "익숙함", "즉흥적"], theme: { 산책: 65, 맛집: 20, 문화: 15 } },
  INFP: { emoji: "🌈", name: "기분따라 산책견", desc: "익숙한 골목도 좋고, 컨디션 내키는 대로 즉흥적으로 움직이는 편이에요.", traits: ["즉흥적", "감성적", "새로움"], theme: { 산책: 50, 맛집: 20, 문화: 30 } },
  INTP: { emoji: "🧭", name: "새로운 골목 탐구자", desc: "호기심 많고 효율적인 동선으로 새로운 곳을 즉흥적으로 탐험해요.", traits: ["호기심", "효율적", "즉흥적"], theme: { 산책: 35, 맛집: 20, 문화: 45 } },
  ESTP: { emoji: "🎲", name: "오늘은 여기 가볼까", desc: "사교적이고 즉흥적, 새로운 곳도 일단 가보고 보는 행동파예요.", traits: ["사교적", "즉흥적", "행동파"], theme: { 산책: 40, 맛집: 35, 문화: 25 } },
  ESFP: { emoji: "🎥", name: "성심당 인싸견", desc: "사람 많은 곳도 잘 어울리고, 기분 따라 신나게 노는 편이에요.", traits: ["사교적", "즉흥적", "감성적"], theme: { 산책: 30, 맛집: 50, 문화: 20 } },
  ENFP: { emoji: "🎈", name: "발길 닿는 대로 모험견", desc: "새로운 곳, 새로운 친구 다 좋아하는 자유로운 인싸 모험가예요.", traits: ["사교적", "새로움", "즉흥적"], theme: { 산책: 35, 맛집: 30, 문화: 35 } },
  ENTP: { emoji: "💡", name: "궁금한 게 많은 탐험가", desc: "사교적이고 호기심 많고, 효율적인 동선으로 새 장소를 정복해요.", traits: ["사교적", "효율적", "새로움"], theme: { 산책: 25, 맛집: 25, 문화: 50 } },
  ESTJ: { emoji: "🗺️", name: "대전 완주 정복단장", desc: "계획 세워 사교적으로, 효율적인 동선으로 정복하는 편이에요.", traits: ["사교적", "계획적", "효율적"], theme: { 산책: 30, 맛집: 30, 문화: 40 } },
  ESFJ: { emoji: "🤝", name: "다정한 마실단", desc: "사람 좋아하고 계획적, 다 같이 즐거운 코스를 중시하는 배려파예요.", traits: ["사교적", "계획적", "감성적"], theme: { 산책: 35, 맛집: 40, 문화: 25 } },
  ENFJ: { emoji: "💪", name: "다 같이 즐거운 반장", desc: "사교적이고 계획적이면서도 컨디션까지 챙기는 다정한 리더예요.", traits: ["사교적", "계획적", "감성적"], theme: { 산책: 30, 맛집: 35, 문화: 35 } },
  ENTJ: { emoji: "🚀", name: "대전 최적화 반장", desc: "사교적이지만 효율 최우선, 계획적으로 정복하는 전략가예요.", traits: ["사교적", "계획적", "효율적"], theme: { 산책: 25, 맛집: 25, 문화: 50 } },
};

export const MBTI_TYPES: Record<string, MbtiTypeInfo> = Object.fromEntries(
  Object.entries(T).map(([code, info]) => [code, { code, ...info }])
);

const DEFAULT_LETTER: Record<string, MbtiAxisLetter> = { EI: "I", SN: "S", TF: "F", JP: "P" };

/** 12개 답변(EI/SN/TF/JP 각 letter 또는 NEUTRAL/null)으로 4글자 MBTI 코드를 산출한다. */
export function scoreAnswers(answers: MbtiAnswer[]): string {
  const scores: Record<MbtiAxisLetter, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  answers.forEach((letter) => {
    if (letter && letter !== "NEUTRAL") scores[letter]++;
  });
  const decide = (a: MbtiAxisLetter, b: MbtiAxisLetter, axis: string) =>
    scores[a] === scores[b] ? DEFAULT_LETTER[axis] : scores[a] > scores[b] ? a : b;
  return decide("E", "I", "EI") + decide("S", "N", "SN") + decide("T", "F", "TF") + decide("J", "P", "JP");
}

export function resolveMbtiType(code: string): MbtiTypeInfo {
  return MBTI_TYPES[code] ?? MBTI_TYPES.ISFJ;
}

/** 해당 타입의 테마 중 가장 매칭도가 높은 테마 */
export function topTheme(type: MbtiTypeInfo): CourseTheme {
  return (Object.entries(type.theme) as [CourseTheme, number][]).sort((a, b) => b[1] - a[1])[0][0];
}
