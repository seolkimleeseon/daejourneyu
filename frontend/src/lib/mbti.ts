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
    tag: "인싸력 테스트",
    emoji: "🐕",
    question: "새로운 사람을 만나면?",
    optionA: { label: "일단 꼬리부터 흔들고 봐요", sub: "인싸 강아지", letter: "E", emoji: "🐕" },
    optionB: { label: "슬금슬금 뒤로 숨어요", sub: "낯가림 대장", letter: "I", emoji: "🐈" },
  },
  {
    axis: "EI",
    tag: "인싸력 테스트",
    emoji: "🐾",
    question: "다른 강아지를 만나면?",
    optionA: { label: "냅다 달려가서 인사해요", sub: "친구는 다다익선", letter: "E", emoji: "🐾" },
    optionB: { label: "곁눈질만 하고 지나가요", sub: "귀찮음 주의보", letter: "I", emoji: "🐶" },
  },
  {
    axis: "EI",
    tag: "인싸력 테스트",
    emoji: "🏞️",
    question: "사람 많은 공원에 가면?",
    optionA: { label: "여기저기 인싸력을 발산해요", sub: "관종끼 폭발", letter: "E", emoji: "🎉" },
    optionB: { label: "구석 자리부터 스캔해요", sub: "혼자가 편해요", letter: "I", emoji: "🌳" },
  },
  {
    axis: "SN",
    tag: "탐험 본능",
    emoji: "🥾",
    question: "산책하다 갈림길이 나오면?",
    optionA: { label: "늘 가던 길로 발이 먼저 가요", sub: "안전제일주의", letter: "S", emoji: "🌳" },
    optionB: { label: "안 가본 길이 더 끌려요", sub: "호기심 천국", letter: "N", emoji: "🧭" },
  },
  {
    axis: "SN",
    tag: "탐험 본능",
    emoji: "🐩",
    question: "새로운 동네를 만나면?",
    optionA: { label: "익숙한 냄새까지만 딱", sub: "루틴 파괴는 싫어요", letter: "S", emoji: "📍" },
    optionB: { label: "온 동네 냄새 정복 완료", sub: "탐험대장", letter: "N", emoji: "🗺️" },
  },
  {
    axis: "SN",
    tag: "탐험 본능",
    emoji: "🗺️",
    question: "미지의 장소에 도착하면?",
    optionA: { label: "일단 냄새부터 살살 맡아봐요", sub: "돌다리도 두들겨요", letter: "S", emoji: "⭐" },
    optionB: { label: "일단 뛰어들고 봐요", sub: "묻고 더블로 가요", letter: "N", emoji: "✨" },
  },
  {
    axis: "TF",
    tag: "감정 표현법",
    emoji: "🥾",
    question: "산책하다 힘들어지면?",
    optionA: { label: "티 안 내고 묵묵히 버텨요", sub: "강철 멘탈", letter: "T", emoji: "🐾" },
    optionB: { label: "주인 다리 붙잡고 응석부려요", sub: "감정 그대로 방출", letter: "F", emoji: "🥺" },
  },
  {
    axis: "TF",
    tag: "감정 표현법",
    emoji: "🐕‍🦺",
    question: "다른 강아지가 다가오면?",
    optionA: { label: "냄새부터 침착하게 분석해요", sub: "탐정 모드", letter: "T", emoji: "🧐" },
    optionB: { label: "반가움 반, 긴장 반 다 티나요", sub: "표정 관리 실패", letter: "F", emoji: "😳" },
  },
  {
    axis: "TF",
    tag: "감정 표현법",
    emoji: "🦴",
    question: "원하는 걸 얻고 싶을 때는?",
    optionA: { label: "묵묵히 눈빛으로 압박해요", sub: "무언의 협박", letter: "T", emoji: "🐕" },
    optionB: { label: "짖고 애교부리고 다 해요", sub: "총공격 모드", letter: "F", emoji: "🐶" },
  },
  {
    axis: "JP",
    tag: "루틴 vs 즉흥",
    emoji: "⏰",
    question: "매일 산책 시간이 되면?",
    optionA: { label: "1분만 늦어도 현관 앞에서 재촉", sub: "칼같은 시간관념", letter: "J", emoji: "📅" },
    optionB: { label: "아무 때나 나가면 그만이죠", sub: "시계 따위 안 봐요", letter: "P", emoji: "😎" },
  },
  {
    axis: "JP",
    tag: "루틴 vs 즉흥",
    emoji: "🎒",
    question: "처음 다른 산책 코스로 가면?",
    optionA: { label: "낯설어서 뒷걸음질 쳐요", sub: "적응 기간 필수", letter: "J", emoji: "🤔" },
    optionB: { label: "오히려 신나서 더 날뛰어요", sub: "새로움은 사랑이야", letter: "P", emoji: "🎉" },
  },
  {
    axis: "JP",
    tag: "루틴 vs 즉흥",
    emoji: "🧸",
    question: "노는 방식을 보면?",
    optionA: { label: "정해진 장난감만 찾아요", sub: "원칙주의 놀이", letter: "J", emoji: "⭐" },
    optionB: { label: "아무거나 물고 늘어져요", sub: "즉흥 예술가", letter: "P", emoji: "🪀" },
  },
];

export interface MbtiTypeInfo {
  code: string;
  /** 성향을 보조 설명하는 작은 뱃지 이모지(강아지 아이콘 옆에 작게 표시) */
  emoji: string;
  name: string;
  desc: string;
  traits: string[];
  theme: Record<CourseTheme, number>;
}

const T: Record<string, Omit<MbtiTypeInfo, "code">> = {
  ISTJ: { emoji: "🦴", name: "칼같은 산책 시계견", desc: "산책 시간 1분만 늦어도 현관 앞에서 눈빛 레이저를 쏴요. 코스도 늘 가던 그 길, 그 시간 그대로예요.", traits: ["시간엄수", "루틴광", "무뚝뚝"], theme: { 산책: 70, 맛집: 15, 문화: 15 } },
  ISFJ: { emoji: "🏠", name: "우리집 껌딱지 집사바라기", desc: "새로운 곳보다 늘 가던 그 산책로가 최고예요. 낯선 사람보단 집사 옆이 세상 편한 껌딱지예요.", traits: ["껌딱지", "낯가림", "다정함"], theme: { 산책: 60, 맛집: 25, 문화: 15 } },
  INFJ: { emoji: "🌙", name: "감성 충만 산책 시인", desc: "사람 없는 산책로에서 혼자 분위기 잡는 걸 좋아해요. 오늘 기분 따라 발걸음도 바뀌는 예술가 타입.", traits: ["감성폭발", "혼자가편해", "즉흥감성"], theme: { 산책: 55, 맛집: 15, 문화: 30 } },
  INTJ: { emoji: "🧭", name: "동선 최적화 전략견", desc: "산책도 머릿속에서 미리 계산 끝냈어요. 쓸데없는 냄새 맡기는 사양, 목적지까지 최단거리로 직진.", traits: ["전략가", "효율충", "무표정"], theme: { 산책: 35, 맛집: 15, 문화: 50 } },
  ISTP: { emoji: "🔍", name: "말 없는 뒷골목 탐정", desc: "짖는 것보다 관찰이 편해요. 아무도 모르게 새 골목을 스윽 파악하고 조용히 사라지는 스타일이에요.", traits: ["관찰력갑", "무심함", "홀로산책"], theme: { 산책: 45, 맛집: 20, 문화: 35 } },
  ISFP: { emoji: "🌸", name: "햇살 좋은 날 감성견", desc: "날씨 좋고 기분 좋으면 그날이 최고의 산책날이에요. 계획은 없지만 늘 가던 그 골목이 제일 편해요.", traits: ["기분파", "감성충만", "자유러버"], theme: { 산책: 65, 맛집: 20, 문화: 15 } },
  INFP: { emoji: "🌈", name: "오늘 기분따라 산책견", desc: "어제와 오늘의 코스가 달라요. 마음 가는 대로, 발 가는 대로 — 계획은 개나 줘버렸어요(진짜로).", traits: ["즉흥만렙", "몽상가", "감성터짐"], theme: { 산책: 50, 맛집: 20, 문화: 30 } },
  INTP: { emoji: "💡", name: "궁금한 건 못 참는 탐구생", desc: "새로운 골목만 보면 눈이 반짝여요. 효율적으로 최대한 많은 곳을 냄새 맡아보고 싶은 타입.", traits: ["호기심대장", "관찰벌레", "즉흥연구"], theme: { 산책: 35, 맛집: 20, 문화: 45 } },
  ESTP: { emoji: "🎲", name: "일단 가보고 보는 행동파", desc: "고민은 짧게, 실행은 빠르게! 새로운 곳도 일단 발부터 들이밀고 보는 행동파 스타일이에요.", traits: ["즉흥행동", "겁없음", "사교왕"], theme: { 산책: 40, 맛집: 35, 문화: 25 } },
  ESFP: { emoji: "🎉", name: "성심당 앞 인싸견", desc: "사람 많은 곳일수록 신나요. 맛있는 냄새가 나는 곳이면 어디든 총총 달려가는 인싸 중의 인싸.", traits: ["핵인싸", "먹부림", "흥부자"], theme: { 산책: 30, 맛집: 50, 문화: 20 } },
  ENFP: { emoji: "🎈", name: "발길 닿는 대로 모험견", desc: "새로운 곳, 새로운 친구 다 좋아요! 계획 세우다 지칠 바엔 일단 나가서 신나게 뛰어노는 자유영혼.", traits: ["모험가", "인싸력갑", "즉흥만렙"], theme: { 산책: 35, 맛집: 30, 문화: 35 } },
  ENTP: { emoji: "💭", name: "밑도 끝도 없이 궁금한 뇌", desc: "왜? 어디로? 뭐가 더 있지? 질문이 끊이질 않아요. 효율적으로 새 장소를 정복하는 게 취미예요.", traits: ["질문폭격기", "효율덕후", "새로움중독"], theme: { 산책: 25, 맛집: 25, 문화: 50 } },
  ESTJ: { emoji: "🗺️", name: "대전 완주 정복단장", desc: "계획표 없이는 산책도 안 나가요. 오늘의 동선, 오늘의 목표 — 다 정복해야 직성이 풀려요.", traits: ["계획충", "완주집착", "리더십"], theme: { 산책: 30, 맛집: 30, 문화: 40 } },
  ESFJ: { emoji: "🤝", name: "다 같이 가요 마실단장", desc: "혼자보다는 다 같이! 모두가 즐거운 코스를 짜는 데 진심인 배려왕이에요. 계획도 감성도 다 챙겨요.", traits: ["배려왕", "분위기메이커", "계획러"], theme: { 산책: 35, 맛집: 40, 문화: 25 } },
  ENFJ: { emoji: "💪", name: "다 같이 즐거운 반장견", desc: "친구들 컨디션까지 다 챙기는 다정한 리더. 계획적이면서도 다정함은 놓치지 않는 완벽주의 반장이에요.", traits: ["다정리더", "챙김쟁이", "계획적감성"], theme: { 산책: 30, 맛집: 35, 문화: 35 } },
  ENTJ: { emoji: "🚀", name: "동선 최적화 반장견", desc: "사교적이지만 목표는 확실해요. 최고 효율로 최대한 많이 정복하는 게 오늘의 미션이에요.", traits: ["효율왕", "목표지향", "카리스마"], theme: { 산책: 25, 맛집: 25, 문화: 50 } },
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
