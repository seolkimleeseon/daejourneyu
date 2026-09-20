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

// ⚠ 질문 문구는 "숨어요"/"경계한다"/"뒷걸음질" 같은 공포·불안 반응으로 읽힐 수 있는 표현을 의도적으로
// 뺐다 — 그런 행동은 성향(내향적/신중함)이 아니라 두려움 반응일 수 있어서, 성향 축과 섞으면
// 결과가 왜곡된다(팀 논의로 확정된 방향).
export const MBTI_QUESTIONS: MbtiQuestion[] = [
  {
    axis: "EI",
    tag: "인싸력 테스트",
    emoji: "🐕",
    question: "새로운 사람을 만나면?",
    optionA: { label: "반갑게 다가가요", sub: "사교왕 기질", letter: "E", emoji: "🙌" },
    optionB: { label: "슬쩍 거리를 둬요", sub: "낯가림 있음", letter: "I", emoji: "🙈" },
  },
  {
    axis: "EI",
    tag: "인싸력 테스트",
    emoji: "🐾",
    question: "다른 강아지를 만나면?",
    optionA: { label: "반갑게 달려가서 인사해요", sub: "친구는 다다익선", letter: "E", emoji: "🐾" },
    optionB: { label: "곁눈질만 하고 지나가요", sub: "혼자가 편해요", letter: "I", emoji: "🐶" },
  },
  {
    axis: "EI",
    tag: "인싸력 테스트",
    emoji: "🏞️",
    question: "사람 많은 공원에 가면?",
    optionA: { label: "여기저기 신나게 인사하러 다녀요", sub: "관종끼 폭발", letter: "E", emoji: "🎉" },
    optionB: { label: "조용한 구석 자리가 편해요", sub: "혼자가 편해요", letter: "I", emoji: "🌳" },
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
    emoji: "👃",
    question: "새로운 냄새를 발견하면?",
    optionA: { label: "잠깐 확인하고 지나가요", sub: "적당히가 좋아", letter: "S", emoji: "😐" },
    optionB: { label: "한참 킁킁거리며 탐색해요", sub: "탐구는 즐거워", letter: "N", emoji: "🔍" },
  },
  {
    axis: "SN",
    tag: "탐험 본능",
    emoji: "🗺️",
    question: "산책 중 처음 보는 장소를 발견하면?",
    optionA: { label: "익숙한 길을 계속 가려고 해요", sub: "돌다리도 두들겨요", letter: "S", emoji: "⭐" },
    optionB: { label: "새로운 장소로 가보려고 해요", sub: "묻고 더블로 가요", letter: "N", emoji: "✨" },
  },
  {
    axis: "TF",
    tag: "감정 표현법",
    emoji: "🥾",
    question: "산책하다 힘들어지면?",
    optionA: { label: "티 안 내고 묵묵히 버텨요", sub: "강철 멘탈", letter: "T", emoji: "🐾" },
    optionB: { label: "주인 다리 붙잡고 응석부려요", sub: "감정 그대로 표현", letter: "F", emoji: "🥺" },
  },
  {
    axis: "TF",
    tag: "감정 표현법",
    emoji: "🐕‍🦺",
    question: "다른 강아지가 다가오면?",
    optionA: { label: "냄새부터 침착하게 분석해요", sub: "탐정 모드", letter: "T", emoji: "🧐" },
    optionB: { label: "반가움이 표정에 다 드러나요", sub: "표현은 솔직하게", letter: "F", emoji: "😳" },
  },
  {
    axis: "TF",
    tag: "감정 표현법",
    emoji: "🦴",
    question: "원하는 걸 얻고 싶을 때는?",
    optionA: { label: "묵묵히 눈빛으로 표현해요", sub: "무언의 어필", letter: "T", emoji: "🐕" },
    optionB: { label: "짖고 애교부리고 다 해요", sub: "총공격 모드", letter: "F", emoji: "🐶" },
  },
  {
    axis: "JP",
    tag: "루틴 vs 즉흥",
    emoji: "⏰",
    question: "매일 산책 시간이 되면?",
    optionA: { label: "1분만 늦어도 현관 앞에서 재촉해요", sub: "칼같은 시간관념", letter: "J", emoji: "📅" },
    optionB: { label: "아무 때나 나가면 그만이죠", sub: "시계 따위 안 봐요", letter: "P", emoji: "😎" },
  },
  {
    axis: "JP",
    tag: "루틴 vs 즉흥",
    emoji: "🎒",
    question: "처음 다른 산책 코스로 가면?",
    optionA: { label: "익숙한 코스가 더 편해요", sub: "루틴이 최고야", letter: "J", emoji: "🏠" },
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

/** 성향 그래프에 쓰는 4개 축. structure는 J일수록 높고 P일수록 낮은 "루틴 지향" 점수(1~5)로
 * 저장해두고, 화면에서 코드 마지막 글자가 J면 "루틴"으로 그 값 그대로, P면 "자유도"로 (6-값)
 * 뒤집어서 보여준다 — 원본 수치를 하나만 들고 있어도 두 라벨 다 자연스럽게 나오게 하기 위해서다. */
export interface MbtiStats {
  social: number;
  explore: number;
  expressive: number;
  structure: number;
}

export interface MbtiTypeInfo {
  code: string;
  /** 성향을 보조 설명하는 작은 뱃지 이모지(강아지 아이콘 옆에 작게 표시) */
  emoji: string;
  name: string;
  /** 결과 카드 말풍선에 넣는 한 줄 인용구 */
  tagline: string;
  desc: string;
  /** 핵심 성향 키워드 4개(사교/독립 · 탐험/익숙 · 표현/차분 · 루틴/자유) */
  traits: string[];
  stats: MbtiStats;
  /** 찰떡 코스 */
  goodFor: string;
  /** 조금 힘들 수 있어요 */
  toughFor: string;
  theme: Record<CourseTheme, number>;
}

const T: Record<string, Omit<MbtiTypeInfo, "code">> = {
  ISTJ: {
    emoji: "⏰",
    name: "루틴수호견",
    tagline: "산책 시간 1분 지났개.",
    desc: "익숙한 사람, 익숙한 길, 익숙한 장난감이 편해요. 감정을 요란하게 표현하기보다는 묵묵한 편이고 자신만의 하루 패턴이 아주 확실한 타입이에요.",
    traits: ["독립", "익숙", "차분", "루틴"],
    stats: { social: 1, explore: 1, expressive: 1, structure: 5 },
    goodFor: "익숙한 산책길 · 정해진 시간의 산책 · 안정적인 숙소 · 반복 가능한 코스",
    toughFor: "계획 없이 낯선 장소를 계속 옮겨 다니는 여행",
    theme: { 산책: 70, 맛집: 15, 문화: 15 },
  },
  ISFJ: {
    emoji: "🧸",
    name: "포근한단골멍",
    tagline: "아는 곳이 제일 마음 편하개.",
    desc: "낯선 사람이나 장소보다는 익숙한 사람과 익숙한 환경에서 가장 편안해요. 좋아하는 산책 시간과 놀이 방식도 분명하고 자기 기분도 보호자에게 잘 표현해요.",
    traits: ["독립", "익숙", "표현", "루틴"],
    stats: { social: 1, explore: 1, expressive: 5, structure: 5 },
    goodFor: "단골 산책길 · 익숙한 카페 · 조용한 휴식형 장소",
    toughFor: "낯선 사람과 장소가 연달아 등장하는 여행",
    theme: { 산책: 60, 맛집: 25, 문화: 15 },
  },
  INFJ: {
    emoji: "🌿",
    name: "살금살금탐험견",
    tagline: "천천히 가면 새로운 곳도 좋개.",
    desc: "사람이 많은 환경보다는 조용한 곳을 좋아하지만 호기심은 꽤 많아요. 새로운 장소를 경험하면서도 자기에게 익숙한 생활 리듬은 지키고 싶은 타입이에요.",
    traits: ["독립", "탐험", "표현", "루틴"],
    stats: { social: 1, explore: 5, expressive: 5, structure: 5 },
    goodFor: "조용한 자연 관광지 · 한적한 신규 산책코스 · 여유 있는 계획여행",
    toughFor: "갑자기 일정이 계속 바뀌는 여행",
    theme: { 산책: 55, 맛집: 15, 문화: 30 },
  },
  INTJ: {
    emoji: "🔭",
    name: "고요한탐험대장",
    tagline: "새로운 길도 차근차근 가볼개.",
    desc: "사교적인 활동보다는 자기만의 탐색을 좋아해요. 새로운 환경에 대한 호기심은 많지만 생활 리듬과 좋아하는 방식도 분명해서 조용하고 체계적인 탐험가에 가까워요.",
    traits: ["독립", "탐험", "차분", "루틴"],
    stats: { social: 1, explore: 5, expressive: 1, structure: 5 },
    goodFor: "한적한 신규 산책로 · 계획된 자연여행 · 탐색할 거리가 있는 장소",
    toughFor: "사람 많고 정신없으면서 일정까지 계속 변하는 장소",
    theme: { 산책: 35, 맛집: 15, 문화: 50 },
  },
  ISTP: {
    emoji: "🚶",
    name: "마이웨이산책견",
    tagline: "난 그냥 내 갈 길 갈개.",
    desc: "다른 사람이나 강아지에게 크게 관심을 두기보다 자기 할 일을 하는 독립파예요. 익숙한 환경을 편하게 느끼지만 반드시 정해진 시간이나 방식대로 움직일 필요도 없어요.",
    traits: ["독립", "익숙", "차분", "자유"],
    stats: { social: 1, explore: 1, expressive: 1, structure: 1 },
    goodFor: "한적한 산책길 · 자유롭게 걷는 코스 · 익숙한 동네 탐방",
    toughFor: "계속 관심과 교류를 요구하는 장소",
    theme: { 산책: 45, 맛집: 20, 문화: 35 },
  },
  ISFP: {
    emoji: "🍃",
    name: "말랑힐링멍",
    tagline: "편안하게, 오늘 기분대로 갈개.",
    desc: "시끌벅적하거나 낯선 곳보다는 편안한 환경을 좋아해요. 그렇다고 정해진 시간표에 얽매이는 것도 별로예요. 익숙하고 편안한 곳에서 그날 기분에 따라 움직이는 타입이에요.",
    traits: ["독립", "익숙", "표현", "자유"],
    stats: { social: 1, explore: 1, expressive: 5, structure: 1 },
    goodFor: "조용한 산책길 · 휴식공간 · 여유로운 카페 · 느슨한 일정",
    toughFor: "자극이 많고 계속 새로운 환경에 적응해야 하는 여행",
    theme: { 산책: 65, 맛집: 20, 문화: 15 },
  },
  INFP: {
    emoji: "☁️",
    name: "감성탐험멍",
    tagline: "조용히 새로운 세상을 구경할개.",
    desc: "북적이는 건 부담스럽지만 그렇다고 새로운 걸 싫어하는 건 아니에요. 한적한 곳에서 자기 속도로 새로운 냄새와 장소를 탐색하는 것을 좋아해요. 기분 표현도 비교적 솔직한 편이에요.",
    traits: ["독립", "탐험", "표현", "자유"],
    stats: { social: 1, explore: 5, expressive: 5, structure: 1 },
    goodFor: "한적한 여행지 · 새로운 자연 산책로 · 여유 있는 자유여행",
    toughFor: "사람이 너무 많은 핫플 · 빡빡한 일정",
    theme: { 산책: 50, 맛집: 20, 문화: 30 },
  },
  INTP: {
    emoji: "🔎",
    name: "새길발견멍",
    tagline: "조용히 내 갈 길을 찾아볼개.",
    desc: "다른 사람이나 강아지에게 큰 관심을 보이지 않아도 새로운 길이나 냄새에는 호기심이 생겨요. 감정 표현도 크지 않고 혼자 조용히 이것저것 탐색하는 마이웨이 탐험가예요.",
    traits: ["독립", "탐험", "차분", "자유"],
    stats: { social: 1, explore: 5, expressive: 1, structure: 1 },
    goodFor: "새로운 산책로 · 냄새 맡을 곳이 많은 자연환경 · 자유로운 탐색",
    toughFor: "계속 다른 사람이나 강아지와 어울려야 하는 장소",
    theme: { 산책: 35, 맛집: 20, 문화: 45 },
  },
  ESTP: {
    emoji: "🐕",
    name: "마이웨이놀멍",
    tagline: "오늘 재밌으면 됐개!",
    desc: "사람이나 강아지를 만나는 건 좋아하지만 정해진 시간표대로 움직일 필요는 없어요. 익숙한 장소에서 그날 눈에 들어오는 것과 자유롭게 노는 걸 좋아해요.",
    traits: ["사교", "익숙", "차분", "자유"],
    stats: { social: 5, explore: 2, expressive: 2, structure: 1 },
    goodFor: "자유롭게 놀 수 있는 공원 · 익숙한 산책길 · 즉흥 산책",
    toughFor: "놀이와 이동 방식이 지나치게 정해진 일정",
    theme: { 산책: 40, 맛집: 35, 문화: 25 },
  },
  ESFP: {
    emoji: "🎉",
    name: "해피핫플멍",
    tagline: "재밌는 데라면 어디든 좋개!",
    desc: "새로운 장소를 찾아다니는 것보다는 좋아하는 환경에서 사람들과 신나게 노는 것이 행복해요. 기분도 행동으로 팍팍 보여주는 분위기 메이커예요.",
    traits: ["사교", "익숙", "표현", "자유"],
    stats: { social: 5, explore: 2, expressive: 5, structure: 1 },
    goodFor: "반려견 카페 · 익숙한 공원 · 사람과 강아지가 있는 활기찬 장소",
    toughFor: "너무 조용하고 교류할 대상이 없는 장소",
    theme: { 산책: 30, 맛집: 50, 문화: 20 },
  },
  ENFP: {
    emoji: "🌈",
    name: "신나개모험왕",
    tagline: "처음 보는 길? 일단 가보개!",
    desc: "새로운 사람도 반갑고 처음 보는 길도 궁금해요. 신나면 신난다고 온몸으로 표현하고, 정해진 방식보다는 그날그날 재미있는 걸 찾아다니는 자유로운 모험가예요.",
    traits: ["사교", "탐험", "표현", "자유"],
    stats: { social: 5, explore: 5, expressive: 5, structure: 2 },
    goodFor: "새로운 산책로 · 야외 관광지 · 체험형 장소 · 자유로운 여행",
    toughFor: "변화 없이 오래 머무르는 일정 · 자극이 거의 없는 장소",
    theme: { 산책: 35, 맛집: 30, 문화: 35 },
  },
  ENTP: {
    emoji: "🧭",
    name: "호기심대장멍",
    tagline: "저건 뭐지? 일단 확인하고 올개!",
    desc: "사람도 좋아하지만 무엇보다 새로운 자극을 발견하는 재미가 중요해요. 처음 보는 길과 냄새를 탐색하면서도 꼭 정해진 방식대로 움직일 필요는 없어요.",
    traits: ["사교", "탐험", "차분", "자유"],
    stats: { social: 5, explore: 5, expressive: 2, structure: 1 },
    goodFor: "새로운 산책로 · 탐색할 것이 많은 자연공간 · 자유 산책",
    toughFor: "매번 똑같은 코스 · 행동이 지나치게 제한되는 장소",
    theme: { 산책: 25, 맛집: 25, 문화: 50 },
  },
  ESTJ: {
    emoji: "📋",
    name: "단골산책대장",
    tagline: "산책은 역시 아는 길이 최고개!",
    desc: "사람들과 어울리는 건 좋아하지만 환경은 익숙한 게 편해요. 산책 시간이나 좋아하는 길, 장난감처럼 자기만의 루틴이 확실한 사교형이에요.",
    traits: ["사교", "익숙", "차분", "루틴"],
    stats: { social: 5, explore: 1, expressive: 2, structure: 5 },
    goodFor: "익숙한 산책길 · 단골 공원 · 일정이 안정적인 여행",
    toughFor: "처음 보는 장소를 계속 이동하는 여행",
    /* 이름(단골산책대장)·태그라인·goodFor가 전부 산책을 가리키는데 문화가 1위였다 —
       topTheme()이 그대로 AI 코스 테마가 되는 탓에 산책형 아이가 문화 코스를 받았다.
       사교형이라 맛집은 남겨두고 산책을 1위로 올린다. */
    theme: { 산책: 45, 맛집: 30, 문화: 25 },
  },
  ESFJ: {
    emoji: "🏡",
    name: "단골마당발멍",
    tagline: "내가 좋아하는 곳에서 친구 만나개!",
    desc: "새로운 곳을 찾아다니기보다는 내가 아는 곳, 아는 사람, 익숙한 놀이에서 행복을 느껴요. 사교적이고 표현도 적극적이라 단골 장소에서는 존재감 만점이에요.",
    traits: ["사교", "익숙", "표현", "루틴"],
    stats: { social: 5, explore: 2, expressive: 5, structure: 5 },
    goodFor: "단골 카페 · 자주 가는 공원 · 익숙한 산책코스",
    toughFor: "매일 숙소와 환경이 달라지는 여행",
    theme: { 산책: 35, 맛집: 40, 문화: 25 },
  },
  ENFJ: {
    emoji: "💛",
    name: "다정한모험대장",
    tagline: "친구도 만나고 새로운 곳도 가개!",
    desc: "사람과 강아지를 만나는 것도 좋아하고 새로운 곳을 탐험하는 것도 좋아해요. 좋고 싫은 게 표정과 행동에 잘 드러나면서도 자기만의 생활 패턴도 비교적 분명해요.",
    traits: ["사교", "탐험", "표현", "루틴"],
    stats: { social: 5, explore: 5, expressive: 5, structure: 4 },
    goodFor: "새로운 공원 · 반려견 동반 관광지 · 다른 강아지를 만날 수 있는 장소",
    toughFor: "교류 없이 혼자 오래 있어야 하는 일정",
    theme: { 산책: 30, 맛집: 35, 문화: 35 },
  },
  ENTJ: {
    emoji: "👑",
    name: "척척탐험대장",
    tagline: "새로운 곳도 내 페이스대로 가개!",
    desc: "낯선 사람이나 장소에도 비교적 적극적이지만 자기 페이스도 확실해요. 새로운 곳을 좋아한다고 무작정 흥분하기보다는 탐색하면서도 익숙한 생활 패턴을 유지하는 타입이에요.",
    traits: ["사교", "탐험", "차분", "루틴"],
    stats: { social: 5, explore: 5, expressive: 2, structure: 5 },
    goodFor: "새로운 산책코스 · 동선이 분명한 여행 · 활동적인 야외 장소",
    toughFor: "일정과 환경이 계속 예상치 못하게 바뀌는 여행",
    theme: { 산책: 25, 맛집: 25, 문화: 50 },
  },
};

export const MBTI_TYPES: Record<string, MbtiTypeInfo> = Object.fromEntries(
  Object.entries(T).map(([code, info]) => [code, { code, ...info }])
);

/**
 * 유형별로 몸에 지니지 않고 옆에 따로 떠 있는 소품(지도·나침반·하트 등) 개수.
 * 원본 소품 시트에서 개별로 오려 `public/icons/mbti-types/decor/{code}-{index}.png`로
 * 저장해뒀고, 결과 화면에서 캐릭터 옆 자리에 떠 있는 것처럼 배치하며 애니메이션을 준다.
 */
export const MBTI_DECOR_COUNT: Record<string, number> = {
  ENTJ: 2,
  ENTP: 2,
  ENFJ: 2,
  ENFP: 2,
  ESTJ: 2,
  ESTP: 2,
  ESFJ: 2,
  ESFP: 2,
  INTJ: 2,
  INTP: 2,
  INFJ: 2,
  INFP: 2,
  ISTJ: 2,
  ISTP: 2,
  ISFJ: 2,
  ISFP: 2,
};

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

/** 성향 그래프 4번째 축 — 코드가 J로 끝나면 "루틴"(값 그대로), P로 끝나면 "자유도"(1~5를 뒤집어서). */
export function structureAxisLabel(code: string): "루틴" | "자유도" {
  return code.endsWith("J") ? "루틴" : "자유도";
}

export function structureAxisValue(code: string, stats: MbtiStats): number {
  return code.endsWith("J") ? stats.structure : 6 - stats.structure;
}
