/**
 * 로컬 개발 DB 시드. `npm run db:seed`로 실행한다.
 * 프론트 목데이터(frontend/src/mocks/courses.ts)를 정본으로 삼아 구조를 맞추고,
 * 캘린더·보관함·둘러보기 화면을 다양한 케이스로 볼 수 있도록 사용자·코스·게시물 종류를 늘렸다.
 * 개발용 ID에 해당하는 데이터를 다시 생성하므로 개발 DB에서만 실행한다.
 * ⚠ 한글 카피는 프론트 CLAUDE.md와 마찬가지로 잠정 데이터로 취급한다.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedUser = {
  id: string;
  email: string | null;
  nickname: string;
};

const users: SeedUser[] = [
  { id: "user-1", email: "kong.owner@example.com", nickname: "콩이맘" },
  { id: "user-2", email: "bori.owner@example.com", nickname: "보리아빠" },
  { id: "user-3", email: "mong.owner@example.com", nickname: "몽이언니" },
  { id: "user-4", email: "dubu.owner@example.com", nickname: "두부아빠" },
  { id: "user-5", email: "choco.owner@example.com", nickname: "초코누나" },
  { id: "user-6", email: "sanche.owner@example.com", nickname: "산체형" },
  { id: "user-7", email: "maru.owner@example.com", nickname: "마루맘" },
  { id: "user-8", email: "byul.owner@example.com", nickname: "별이아빠" },
];

type SeedPet = {
  id: string;
  userId: string;
  name: string;
  breed: string;
  weightKg: number;
  ageYears: number;
  size: "소형견" | "중형견" | "대형견";
  emoji: string;
  mbtiCode: string;
  mbtiName: string;
  mbtiTheme: "산책" | "맛집" | "문화";
  mbtiTraits: string[];
};

const pets: SeedPet[] = [
  {
    id: "pet-1",
    userId: "user-1",
    name: "콩이",
    breed: "말티즈",
    weightKg: 3.2,
    ageYears: 2,
    size: "소형견",
    emoji: "🐕",
    mbtiCode: "ENFP",
    mbtiName: "신나개모험왕",
    mbtiTheme: "산책",
    mbtiTraits: ["사교", "탐험", "표현", "자유"],
  },
  {
    id: "pet-2",
    userId: "user-2",
    name: "보리",
    breed: "진돗개",
    weightKg: 19.5,
    ageYears: 4,
    size: "대형견",
    emoji: "🦮",
    mbtiCode: "ISTJ",
    mbtiName: "루틴수호견",
    mbtiTheme: "산책",
    mbtiTraits: ["독립", "익숙", "차분", "루틴"],
  },
  {
    id: "pet-3",
    userId: "user-3",
    name: "몽이",
    breed: "푸들",
    weightKg: 4.1,
    ageYears: 3,
    size: "소형견",
    emoji: "🐩",
    mbtiCode: "ISFP",
    mbtiName: "말랑힐링멍",
    mbtiTheme: "산책",
    mbtiTraits: ["독립", "익숙", "표현", "자유"],
  },
  {
    id: "pet-4",
    userId: "user-4",
    name: "두부",
    breed: "웰시코기",
    weightKg: 11.3,
    ageYears: 2,
    size: "중형견",
    emoji: "🐕",
    mbtiCode: "ESFP",
    mbtiName: "해피핫플멍",
    mbtiTheme: "맛집",
    mbtiTraits: ["사교", "익숙", "표현", "자유"],
  },
  {
    id: "pet-5",
    userId: "user-5",
    name: "초코",
    breed: "리트리버",
    weightKg: 28.0,
    ageYears: 5,
    size: "대형견",
    emoji: "🐕‍🦺",
    mbtiCode: "ENFJ",
    mbtiName: "다정한모험대장",
    mbtiTheme: "맛집",
    mbtiTraits: ["사교", "탐험", "표현", "루틴"],
  },
  {
    id: "pet-6",
    userId: "user-6",
    name: "산체",
    breed: "시바견",
    weightKg: 9.8,
    ageYears: 3,
    size: "중형견",
    emoji: "🐕",
    mbtiCode: "INTJ",
    mbtiName: "고요한탐험대장",
    mbtiTheme: "문화",
    mbtiTraits: ["독립", "탐험", "차분", "루틴"],
  },
  {
    id: "pet-7",
    userId: "user-7",
    name: "마루",
    breed: "비숑프리제",
    weightKg: 5.6,
    ageYears: 1,
    size: "소형견",
    emoji: "🐶",
    mbtiCode: "ESFJ",
    mbtiName: "단골마당발멍",
    mbtiTheme: "맛집",
    mbtiTraits: ["사교", "익숙", "표현", "루틴"],
  },
  {
    id: "pet-8",
    userId: "user-8",
    name: "별이",
    breed: "포메라니안",
    weightKg: 2.8,
    ageYears: 4,
    size: "소형견",
    emoji: "🐶",
    mbtiCode: "INFP",
    mbtiName: "감성탐험멍",
    mbtiTheme: "문화",
    mbtiTraits: ["독립", "탐험", "표현", "자유"],
  },
];

type SeedStop = {
  placeId: string;
  name: string;
  category: string;
  district: string;
  condition: string;
  petFriendly: boolean;
};

type SeedCourse = {
  id: string;
  label: string;
  emoji?: string;
  nights: number;
  transport: "자차" | "대중교통";
  source: "ai" | "manual" | "saved";
  shared: boolean;
  userId: string;
  days: SeedStop[][];
  schedule?: { date: string; festivalTitles: string[] };
};

const stop = (
  placeId: string,
  name: string,
  category: string,
  district: string,
  condition: string,
  petFriendly = true
): SeedStop => ({ placeId, name, category, district, condition, petFriendly });

const courses: SeedCourse[] = [
  {
    id: "course-1",
    label: "콩이랑 유성 나들이",
    emoji: "🐾",
    nights: 0,
    transport: "자차",
    source: "manual",
    shared: true,
    userId: "user-1",
    days: [
      [
        stop("place-1", "한밭수목원", "산책", "서구", "전 견종 · 목줄 필수"),
        stop("place-4", "유성 반려동물 놀이터", "놀이터", "유성구", "대형견 구역 분리"),
        stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능"),
      ],
    ],
    schedule: { date: "2026-08-23", festivalTitles: ["유성 반려동물 마켓"] },
  },
  {
    id: "course-2",
    label: "AI 추천 · 산책형 코스",
    emoji: "🌳",
    nights: 1,
    transport: "대중교통",
    source: "ai",
    shared: false,
    userId: "user-2",
    days: [
      [stop("place-2", "계족산 황톳길", "산책", "대덕구", "전 견종 · 배변봉투 지참")],
      [stop("place-3", "대청호 오백리길", "산책", "동구", "전 견종 · 목줄 필수")],
    ],
  },
  {
    id: "course-3",
    label: "대흥동 감성 카페 투어",
    emoji: "☕",
    nights: 0,
    transport: "대중교통",
    source: "manual",
    shared: true,
    userId: "user-3",
    days: [
      [
        stop("place-6", "대흥동 감성 카페", "맛집", "중구", "소형견만 가능"),
        stop("place-7", "성심당 본점", "맛집", "중구", "매장 내 동반 불가 · 포장만", false),
      ],
    ],
  },
  {
    id: "course-4",
    label: "소형견 전용 힐링 코스",
    emoji: "🐩",
    nights: 0,
    transport: "자차",
    source: "manual",
    shared: true,
    userId: "user-3",
    days: [
      [
        stop("place-6", "대흥동 감성 카페", "맛집", "중구", "소형견만 가능"),
        stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능"),
      ],
    ],
    schedule: { date: "2026-08-25", festivalTitles: [] },
  },
  {
    id: "course-5",
    label: "AI 추천 · 문화형 코스",
    emoji: "🏛️",
    nights: 1,
    transport: "자차",
    source: "ai",
    shared: false,
    userId: "user-6",
    days: [
      [
        stop("place-8", "이응노미술관", "문화", "서구", "실내 동반 불가", false),
        stop("place-9", "엑스포과학공원", "문화", "유성구", "야외만 동반 가능"),
      ],
      [stop("place-10", "유성온천 족욕체험장", "문화", "유성구", "실외 구역만 동반 가능")],
    ],
  },
  {
    id: "course-6",
    label: "대덕구 황톳길 2박 3일",
    emoji: "🥾",
    nights: 2,
    transport: "자차",
    source: "manual",
    shared: true,
    userId: "user-2",
    days: [
      [stop("place-2", "계족산 황톳길", "산책", "대덕구", "전 견종 · 배변봉투 지참")],
      [stop("place-3", "대청호 오백리길", "산책", "동구", "전 견종 · 목줄 필수")],
      [stop("place-4", "유성 반려동물 놀이터", "놀이터", "유성구", "대형견 구역 분리")],
    ],
    schedule: { date: "2026-09-05", festivalTitles: ["대덕 황톳길 축제"] },
  },
  {
    id: "course-7",
    label: "겨울 유성온천 나들이",
    emoji: "♨️",
    nights: 0,
    transport: "대중교통",
    source: "saved",
    shared: false,
    userId: "user-8",
    days: [
      [
        stop("place-10", "유성온천 족욕체험장", "문화", "유성구", "실외 구역만 동반 가능"),
        stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능"),
      ],
    ],
  },
  {
    id: "course-8",
    label: "엄마아빠랑 대전 한바퀴",
    emoji: "🚗",
    nights: 1,
    transport: "자차",
    source: "saved",
    shared: true,
    userId: "user-1",
    days: [
      [
        stop("place-1", "한밭수목원", "산책", "서구", "전 견종 · 목줄 필수"),
        stop("place-8", "이응노미술관", "문화", "서구", "실내 동반 불가", false),
      ],
      [
        stop("place-9", "엑스포과학공원", "문화", "유성구", "야외만 동반 가능"),
        stop("place-3", "대청호 오백리길", "산책", "동구", "전 견종 · 목줄 필수"),
      ],
    ],
    schedule: { date: "2026-08-30", festivalTitles: ["대전 사이언스 페스티벌", "유성 반려동물 마켓"] },
  },
  {
    id: "course-9",
    label: "장태산 편백숲 산책",
    emoji: "🌲",
    nights: 0,
    transport: "자차",
    source: "manual",
    shared: true,
    userId: "user-5",
    days: [
      [stop("place-11", "장태산자연휴양림", "산책", "서구", "전 견종 · 목줄 필수 · 편백숲 산책로")],
    ],
  },
  {
    id: "course-10",
    label: "대형견 뛰놀기 코스",
    emoji: "🐕‍🦺",
    nights: 0,
    transport: "자차",
    source: "manual",
    shared: false,
    userId: "user-5",
    days: [
      [
        stop("place-2", "계족산 황톳길", "산책", "대덕구", "전 견종 · 배변봉투 지참"),
        stop("place-4", "유성 반려동물 놀이터", "놀이터", "유성구", "대형견 구역 분리"),
      ],
    ],
  },
  {
    id: "course-11",
    label: "빵지순례 하루 코스",
    emoji: "🥐",
    nights: 0,
    transport: "대중교통",
    source: "manual",
    shared: true,
    userId: "user-4",
    days: [
      [
        stop("place-7", "성심당 본점", "맛집", "중구", "매장 내 동반 불가 · 포장만", false),
        stop("place-6", "대흥동 감성 카페", "맛집", "중구", "소형견만 가능"),
        stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능"),
      ],
    ],
    schedule: { date: "2026-09-14", festivalTitles: [] },
  },
  {
    id: "course-12",
    label: "AI 추천 · 맛집형 코스",
    emoji: "✨",
    nights: 0,
    transport: "대중교통",
    source: "ai",
    shared: false,
    userId: "user-7",
    days: [
      [
        stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능"),
        stop("place-12", "대전오월드", "문화", "중구", "야외 구역만 동반 가능"),
      ],
    ],
  },
];

type SeedPost = {
  id: string;
  userId: string;
  courseId?: string;
  authorName: string;
  authorEmoji: string;
  petTypeName: string;
  caption: string;
  text: string;
  tags: string[];
  likes: number;
  saves: number;
  daysAgo: number;
  stops: SeedStop[];
};

/** 둘러보기 게시물 — 작성자를 여러 사용자로 흩어 "내 글/남의 글" 구분과 담기 동작을 다양하게 볼 수 있게 했다. */
const posts: SeedPost[] = [
  {
    id: "post-15",
    userId: "user-4",
    authorName: "두부아빠",
    authorEmoji: "🐕",
    petTypeName: "해피핫플멍",
    caption: "비 오는 오후, 카페 한 곳에서 쉬어가기",
    text: "일정을 줄이고 대흥동 카페에서 오래 쉬었어요. 자리가 넓어 이동 가방을 놓기 편했지만 주말에는 미리 문의하는 편이 좋아요.",
    tags: ["소형견 OK", "실내", "우천"],
    likes: 2,
    saves: 1,
    daysAgo: 1,
    stops: [stop("place-6", "대흥동 감성 카페", "맛집", "중구", "소형견만 가능")],
  },
  {
    id: "post-16",
    userId: "user-5",
    courseId: "course-9",
    authorName: "초코누나",
    authorEmoji: "🐕‍🦺",
    petTypeName: "다정한모험대장",
    caption: "장태산 그늘길, 더운 날 산책 후기",
    text: "그늘진 구간을 골라 짧게 걸었어요. 입구 주차장은 붐벼서 이른 시간에 도착하는 게 편했습니다.",
    tags: ["대형견 OK", "산책", "주차 주의"],
    likes: 17,
    saves: 10,
    daysAgo: 5,
    stops: [stop("place-11", "장태산자연휴양림", "산책", "서구", "전 견종 · 목줄 필수 · 편백숲 산책로")],
  },
  {
    id: "post-17",
    userId: "user-3",
    authorName: "몽이언니",
    authorEmoji: "🐩",
    petTypeName: "말랑힐링멍",
    caption: "포장만 가능한 빵집 들르는 법",
    text: "성심당 안에는 몽이와 함께 들어갈 수 없어 동행인이 포장을 맡았어요. 매장 이용을 기대하고 방문하지 않도록 참고하세요.",
    tags: ["동반 불가", "포장", "중구"],
    likes: 4,
    saves: 8,
    daysAgo: 9,
    stops: [stop("place-7", "성심당 본점", "맛집", "중구", "매장 내 동반 불가 · 포장만", false)],
  },
  {
    id: "post-18",
    userId: "user-8",
    courseId: "course-7",
    authorName: "별이아빠",
    authorEmoji: "🐶",
    petTypeName: "감성탐험멍",
    caption: "조용한 유성 당일치기 동선",
    text: "족욕체험장 실외 구역을 둘러본 뒤 베이커리에서 쉬었어요. 붐비는 시간대를 피하니 별이도 차분했습니다.",
    tags: ["소형견 OK", "당일치기", "유성구"],
    likes: 12,
    saves: 6,
    daysAgo: 14,
    stops: [
      stop("place-10", "유성온천 족욕체험장", "문화", "유성구", "실외 구역만 동반 가능"),
      stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능"),
    ],
  },
  {
    id: "post-19",
    userId: "user-2",
    authorName: "보리아빠",
    authorEmoji: "🦮",
    petTypeName: "루틴수호견",
    caption: "대형견 놀이터 방문 전 확인할 것",
    text: "대형견 구역이 따로 있어 편했어요. 그늘이 적은 날에는 물과 휴식 시간을 넉넉히 준비해야 합니다.",
    tags: ["대형견 OK", "놀이터", "그늘 주의"],
    likes: 21,
    saves: 13,
    daysAgo: 28,
    stops: [stop("place-4", "유성 반려동물 놀이터", "놀이터", "유성구", "대형견 구역 분리")],
  },
  {
    id: "post-20",
    userId: "user-7",
    authorName: "마루맘",
    authorEmoji: "🐶",
    petTypeName: "단골마당발멍",
    caption: "간식 사러 베이커리만 다녀온 날",
    text: "실내 동반이 가능해서 잠깐 쉬어가기 좋았어요. 마루가 먹을 간식은 성분을 확인하고 골랐습니다.",
    tags: ["소형견 OK", "실내", "간식"],
    likes: 0,
    saves: 0,
    daysAgo: 0,
    stops: [stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능")],
  },
  {
    id: "post-1",
    userId: "user-2",
    authorName: "보리아빠",
    authorEmoji: "🦮",
    petTypeName: "루틴수호견",
    caption: "대청호 1박 2일, 대형견도 편했어요",
    text: "첫날 산책로, 둘째 날 반려동물 놀이터까지 여유롭게 돌았어요. 보리도 컨디션이 정말 좋아 보였습니다.",
    tags: ["대형견 OK", "자차", "1박 2일"],
    likes: 24,
    saves: 12,
    daysAgo: 21,
    stops: [
      stop("place-3", "대청호 오백리길", "산책", "동구", "전 견종 · 목줄 필수"),
      stop("place-4", "유성 반려동물 놀이터", "놀이터", "유성구", "대형견 구역 분리"),
    ],
  },
  {
    id: "post-2",
    userId: "user-1",
    courseId: "course-1",
    authorName: "콩이맘",
    authorEmoji: "🐕",
    petTypeName: "신나개모험왕",
    caption: "콩이랑 유성 나들이",
    text: "놀이터에서 실컷 뛰고 베이커리에서 마무리했어요. 콩이가 사람도 강아지도 다 좋아해서 신났던 하루!",
    tags: ["소형견 OK", "당일치기", "유성구"],
    likes: 9,
    saves: 5,
    daysAgo: 19,
    stops: [
      stop("place-1", "한밭수목원", "산책", "서구", "전 견종 · 목줄 필수"),
      stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능"),
    ],
  },
  {
    id: "post-3",
    userId: "user-3",
    courseId: "course-3",
    authorName: "몽이언니",
    authorEmoji: "🐩",
    petTypeName: "말랑힐링멍",
    caption: "대흥동 감성 카페 투어, 몽이 완전 힐링",
    text: "소형견만 가능한 카페라 눈치 안 보고 편하게 있었어요. 성심당은 포장만 가능해서 카페에서 같이 먹었답니다.",
    tags: ["소형견 OK", "카페", "중구"],
    likes: 31,
    saves: 18,
    daysAgo: 17,
    stops: [
      stop("place-6", "대흥동 감성 카페", "맛집", "중구", "소형견만 가능"),
      stop("place-7", "성심당 본점", "맛집", "중구", "매장 내 동반 불가 · 포장만", false),
    ],
  },
  {
    id: "post-4",
    userId: "user-6",
    courseId: "course-5",
    authorName: "산체형",
    authorEmoji: "🐕",
    petTypeName: "고요한탐험대장",
    caption: "이응노미술관 근처, 조용히 걷기 좋은 코스",
    text: "미술관 안은 동반이 안 돼서 밖에서 산체랑 사진만 찍고, 엑스포과학공원 야외 구역에서 산책했어요.",
    tags: ["문화형", "서구", "1박 2일"],
    likes: 15,
    saves: 7,
    daysAgo: 15,
    stops: [
      stop("place-8", "이응노미술관", "문화", "서구", "실내 동반 불가", false),
      stop("place-9", "엑스포과학공원", "문화", "유성구", "야외만 동반 가능"),
    ],
  },
  {
    id: "post-5",
    userId: "user-2",
    courseId: "course-6",
    authorName: "보리아빠",
    authorEmoji: "🦮",
    petTypeName: "루틴수호견",
    caption: "대덕구 황톳길 2박 3일 완주!",
    text: "매일 다른 코스로 걸었는데 보리가 지치지 않고 끝까지 잘 걸었어요. 배변봉투는 넉넉히 챙기는 걸 추천해요.",
    tags: ["대형견 OK", "2박 3일", "대덕구"],
    likes: 42,
    saves: 26,
    daysAgo: 12,
    stops: [
      stop("place-2", "계족산 황톳길", "산책", "대덕구", "전 견종 · 배변봉투 지참"),
      stop("place-3", "대청호 오백리길", "산책", "동구", "전 견종 · 목줄 필수"),
      stop("place-4", "유성 반려동물 놀이터", "놀이터", "유성구", "대형견 구역 분리"),
    ],
  },
  {
    id: "post-6",
    userId: "user-8",
    courseId: "course-7",
    authorName: "별이아빠",
    authorEmoji: "🐶",
    petTypeName: "감성탐험멍",
    caption: "겨울 유성온천, 발 시린 날 다녀왔어요",
    text: "족욕체험장은 실외 구역만 동반 가능해서 겉옷 챙겨서 같이 앉아있었어요. 별이가 얌전히 잘 있어줬어요.",
    tags: ["소형견 OK", "유성구", "당일치기"],
    likes: 11,
    saves: 4,
    daysAgo: 10,
    stops: [
      stop("place-10", "유성온천 족욕체험장", "문화", "유성구", "실외 구역만 동반 가능"),
      stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능"),
    ],
  },
  {
    id: "post-7",
    userId: "user-1",
    courseId: "course-8",
    authorName: "콩이맘",
    authorEmoji: "🐕",
    petTypeName: "신나개모험왕",
    caption: "부모님 모시고 대전 한바퀴",
    text: "이응노미술관은 밖에서만, 엑스포과학공원이랑 대청호는 신나게 걸었어요. 축제까지 겹쳐서 더 즐거웠던 1박 2일.",
    tags: ["가족여행", "1박 2일", "서구"],
    likes: 37,
    saves: 20,
    daysAgo: 8,
    stops: [
      stop("place-1", "한밭수목원", "산책", "서구", "전 견종 · 목줄 필수"),
      stop("place-9", "엑스포과학공원", "문화", "유성구", "야외만 동반 가능"),
    ],
  },
  {
    id: "post-8",
    userId: "user-5",
    courseId: "course-9",
    authorName: "초코누나",
    authorEmoji: "🐕‍🦺",
    petTypeName: "다정한모험대장",
    caption: "장태산 편백숲, 피톤치드 가득한 산책",
    text: "그늘이 많아서 여름에도 시원하게 걸을 수 있었어요. 초코가 냄새 맡느라 정신없었던 하루예요.",
    tags: ["대형견 OK", "서구", "숲길"],
    likes: 28,
    saves: 14,
    daysAgo: 7,
    stops: [stop("place-11", "장태산자연휴양림", "산책", "서구", "전 견종 · 목줄 필수 · 편백숲 산책로")],
  },
  {
    id: "post-9",
    userId: "user-5",
    courseId: "course-10",
    authorName: "초코누나",
    authorEmoji: "🐕‍🦺",
    petTypeName: "다정한모험대장",
    caption: "대형견도 마음껏 뛸 수 있는 코스",
    text: "황톳길에서 실컷 걷고 놀이터 대형견 구역에서 뛰놀았어요. 초코가 이날 제일 신나 보였어요.",
    tags: ["대형견 OK", "대덕구", "당일치기"],
    likes: 19,
    saves: 9,
    daysAgo: 6,
    stops: [
      stop("place-2", "계족산 황톳길", "산책", "대덕구", "전 견종 · 배변봉투 지참"),
      stop("place-4", "유성 반려동물 놀이터", "놀이터", "유성구", "대형견 구역 분리"),
    ],
  },
  {
    id: "post-10",
    userId: "user-4",
    courseId: "course-11",
    authorName: "두부아빠",
    authorEmoji: "🐕",
    petTypeName: "해피핫플멍",
    caption: "빵순이 두부와 함께한 빵지순례",
    text: "성심당은 포장만 되지만, 대흥동 카페랑 댕댕 베이커리는 같이 들어갈 수 있어서 두부도 신났어요.",
    tags: ["소형견 OK", "카페", "중구"],
    likes: 33,
    saves: 21,
    daysAgo: 4,
    stops: [
      stop("place-7", "성심당 본점", "맛집", "중구", "매장 내 동반 불가 · 포장만", false),
      stop("place-6", "대흥동 감성 카페", "맛집", "중구", "소형견만 가능"),
      stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능"),
    ],
  },
  {
    id: "post-11",
    userId: "user-7",
    courseId: "course-12",
    authorName: "마루맘",
    authorEmoji: "🐶",
    petTypeName: "단골마당발멍",
    caption: "AI가 추천해준 맛집형 코스, 신뢰할 만해요",
    text: "베이커리에서 간식 먹고 오월드 야외 구역 산책까지, AI 추천 그대로 따라갔는데 동선이 편했어요.",
    tags: ["소형견 OK", "AI 추천", "당일치기"],
    likes: 8,
    saves: 3,
    daysAgo: 3,
    stops: [
      stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능"),
      stop("place-12", "대전오월드", "문화", "중구", "야외 구역만 동반 가능"),
    ],
  },
  {
    id: "post-12",
    userId: "user-3",
    courseId: "course-4",
    authorName: "몽이언니",
    authorEmoji: "🐩",
    petTypeName: "말랑힐링멍",
    caption: "소형견 전용 힐링 코스 추천해요",
    text: "카페 두 곳 다 소형견 기준이 확실해서 미리 걱정 안 해도 됐어요. 몽이가 낯가림이 있는데도 편안해했어요.",
    tags: ["소형견 OK", "카페", "힐링"],
    likes: 22,
    saves: 16,
    daysAgo: 2,
    stops: [
      stop("place-6", "대흥동 감성 카페", "맛집", "중구", "소형견만 가능"),
      stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능"),
    ],
  },
  {
    id: "post-13",
    userId: "user-8",
    authorName: "별이아빠",
    authorEmoji: "🐶",
    petTypeName: "감성탐험멍",
    caption: "비 오는 날엔 역시 실내 카페",
    text: "갑자기 비가 와서 급하게 근처 카페로 피신했는데, 별이는 오히려 이런 조용한 분위기를 더 좋아하는 것 같아요.",
    tags: ["소형견 OK", "실내", "우천"],
    likes: 6,
    saves: 2,
    daysAgo: 1,
    stops: [stop("place-6", "대흥동 감성 카페", "맛집", "중구", "소형견만 가능")],
  },
  {
    id: "post-14",
    userId: "user-6",
    authorName: "산체형",
    authorEmoji: "🐕",
    petTypeName: "고요한탐험대장",
    caption: "혼자 조용히 걷는 산책도 좋아요",
    text: "사람 없는 이른 아침에 한밭수목원을 걸었어요. 산체는 이렇게 한적한 걸 제일 좋아하는 타입이에요.",
    tags: ["대형견 OK", "서구", "아침산책"],
    likes: 13,
    saves: 6,
    daysAgo: 0,
    stops: [stop("place-1", "한밭수목원", "산책", "서구", "전 견종 · 목줄 필수")],
  },
];

/** 후기 태그 사전 — 자유 입력을 막는 대신 여기 등록된 것만 고를 수 있다(root CLAUDE.md 도메인 용어 §후기). */
function extraPost(
  id: string, userId: string, caption: string, text: string, tags: string[],
  daysAgo: number, likes: number, saves: number, stops: SeedStop[], courseId?: string
): SeedPost {
  const user = users.find((item) => item.id === userId)!;
  const pet = pets.find((item) => item.userId === userId)!;
  return { id, userId, courseId, authorName: user.nickname, authorEmoji: pet.emoji,
    petTypeName: pet.mbtiName, caption, text, tags, daysAgo, likes, saves, stops };
}

posts.push(
  extraPost("post-21", "user-1", "수목원에서 짧게 산책한 날", "콩이가 좋아하는 평탄한 길만 골라 걸었어요. 목줄을 매고 사람이 많은 구간은 천천히 지나갔습니다.",
    ["소형견 OK", "산책", "서구"], 2, 6, 2, [stop("place-1", "한밭수목원", "산책", "서구", "전 견종 · 목줄 필수")]),
  extraPost("post-22", "user-2", "보리와 대청호 호숫길", "걷는 거리를 짧게 나눠 쉬어 갔어요. 전망이 좋아도 목줄과 물은 꼭 챙겨야 했습니다.",
    ["대형견 OK", "산책", "동구"], 11, 25, 12, [stop("place-3", "대청호 오백리길", "산책", "동구", "전 견종 · 목줄 필수")]),
  extraPost("post-23", "user-3", "몽이와 카페 두 곳 비교", "첫 카페는 자리가 편했고 베이커리는 간식을 고르기 좋았어요. 두 장소의 동반 규칙은 방문 전에 다시 확인했습니다.",
    ["소형견 OK", "카페", "실내"], 6, 18, 9, [
      stop("place-6", "대흥동 감성 카페", "맛집", "중구", "소형견만 가능"),
      stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능"),
    ], "course-4"),
  extraPost("post-24", "user-4", "두부와 빵집 포장 동선", "한 명은 두부와 밖에서 기다리고 한 명은 빵을 포장했어요. 매장 내부 동반은 불가해요.",
    ["동반 불가", "포장", "중구"], 3, 7, 5, [stop("place-7", "성심당 본점", "맛집", "중구", "매장 내 동반 불가 · 포장만", false)]),
  extraPost("post-25", "user-5", "초코의 넓은 놀이터 탐방", "대형견 구역에서 신나게 뛰었어요. 한낮에는 그늘이 적어 짧게 놀고 물을 마셨습니다.",
    ["대형견 OK", "놀이터", "그늘 주의"], 18, 44, 30, [stop("place-4", "유성 반려동물 놀이터", "놀이터", "유성구", "대형견 구역 분리")], "course-10"),
  extraPost("post-26", "user-6", "산체와 조용한 숲길", "사람이 적은 시간에 장태산을 걸었어요. 긴 코스 대신 그늘진 길을 짧게 돌아봤습니다.",
    ["산책", "조용한 곳", "서구"], 13, 11, 6, [stop("place-11", "장태산자연휴양림", "산책", "서구", "전 견종 · 목줄 필수 · 편백숲 산책로")]),
  extraPost("post-27", "user-7", "마루와 간식만 사 온 오후", "실내 동반이 가능한 베이커리에서 잠시 쉬고 간식을 샀어요. 오래 머무는 일정 없이 한 곳만 다녀왔습니다.",
    ["소형견 OK", "실내", "간식"], 0, 1, 0, [stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능")]),
  extraPost("post-28", "user-8", "별이의 유성 야외 나들이", "족욕체험장에서는 실외 구역만 이용했어요. 별이가 지치기 전에 일정을 마쳤습니다.",
    ["소형견 OK", "야외", "유성구"], 4, 9, 4, [stop("place-10", "유성온천 족욕체험장", "문화", "유성구", "실외 구역만 동반 가능")]),
  extraPost("post-29", "user-1", "엑스포 야외 구역 사진 산책", "콩이와 야외 공간에서 사진을 찍었어요. 실내 시설은 반려견 동반 조건을 별도로 확인해야 합니다.",
    ["산책", "사진", "유성구"], 24, 36, 18, [stop("place-9", "엑스포과학공원", "문화", "유성구", "야외만 동반 가능")]),
  extraPost("post-30", "user-2", "비 온 다음 날 황톳길", "젖은 구간이 있어 보리와 걷는 속도를 늦췄어요. 돌아오는 길에는 발을 닦을 수건이 유용했습니다.",
    ["대형견 OK", "산책", "우천 후"], 7, 15, 8, [stop("place-2", "계족산 황톳길", "산책", "대덕구", "전 견종 · 배변봉투 지참")]),
);

type SeedReviewTag = { code: string; label: string; category: string; sortOrder: number };

const reviewTagOptions: SeedReviewTag[] = [
  // 반려동물 동반 조건
  { code: "LEASH_REQUIRED", label: "목줄 필수", category: "PET_CONDITION", sortOrder: 0 },
  { code: "SMALL_DOG_ONLY", label: "소형견만", category: "PET_CONDITION", sortOrder: 1 },
  { code: "LARGE_DOG_OK", label: "대형견 동반 가능", category: "PET_CONDITION", sortOrder: 2 },
  { code: "LARGE_DOG_ZONE", label: "대형견 구역 분리", category: "PET_CONDITION", sortOrder: 3 },
  { code: "INDOOR_ALLOWED", label: "실내 동반 가능", category: "PET_CONDITION", sortOrder: 4 },
  { code: "WASTE_BAG_PROVIDED", label: "배변봉투 비치", category: "PET_CONDITION", sortOrder: 5 },
  { code: "PET_MENU", label: "반려동물 전용 메뉴/간식", category: "PET_CONDITION", sortOrder: 6 },
  // 공간 · 환경
  { code: "GOOD_WALK", label: "산책로 좋아요", category: "ENVIRONMENT", sortOrder: 0 },
  { code: "GRASS_FIELD", label: "잔디밭 있어요", category: "ENVIRONMENT", sortOrder: 1 },
  { code: "SHADY", label: "그늘 많아요", category: "ENVIRONMENT", sortOrder: 2 },
  { code: "GOOD_VIEW", label: "경치 좋아요", category: "ENVIRONMENT", sortOrder: 3 },
  { code: "QUIET", label: "조용해요", category: "ENVIRONMENT", sortOrder: 4 },
  // 편의시설
  { code: "WATER_BOWL", label: "물그릇 제공", category: "AMENITY", sortOrder: 0 },
  { code: "PARKING_EASY", label: "주차 편해요", category: "AMENITY", sortOrder: 1 },
  { code: "CLEAN_RESTROOM", label: "화장실 깨끗해요", category: "AMENITY", sortOrder: 2 },
  { code: "COMFY_SEATING", label: "좌석 편안해요", category: "AMENITY", sortOrder: 3 },
  // 서비스 · 분위기
  { code: "KIND_STAFF", label: "직원이 친절해요", category: "SERVICE", sortOrder: 0 },
  { code: "PET_FRIENDLY_STAFF", label: "반려동물에 친절해요", category: "SERVICE", sortOrder: 1 },
  { code: "PHOTO_SPOT", label: "사진찍기 좋아요", category: "SERVICE", sortOrder: 2 },
  { code: "REASONABLE_PRICE", label: "가격이 합리적이에요", category: "SERVICE", sortOrder: 3 },
  // 주의할 점
  { code: "LACK_SHADE", label: "그늘 부족", category: "CAUTION", sortOrder: 0 },
  { code: "MANY_STAIRS", label: "계단 많아요", category: "CAUTION", sortOrder: 1 },
  { code: "NOISY", label: "소음 있어요", category: "CAUTION", sortOrder: 2 },
  { code: "SLIPPERY_FLOOR", label: "바닥이 미끄러워요", category: "CAUTION", sortOrder: 3 },
  { code: "PARKING_HARD", label: "주차 불편해요", category: "CAUTION", sortOrder: 4 },
];

/** frontend/src/mocks/reviews.ts를 옮긴 초기 후기 — 태그는 위 사전의 code로 연결한다. */
type SeedReview = {
  id: string;
  placeId: string;
  placeName: string;
  authorId: string;
  text: string;
  tagCodes: string[];
  likesCount: number;
};

const reviews: SeedReview[] = [
  {
    id: "review-7",
    placeId: "place-1",
    placeName: "한밭수목원",
    authorId: "user-6",
    text: "아침에는 한적해서 산체와 천천히 걷기 좋았어요. 목줄을 착용하고 산책로를 이용했습니다.",
    tagCodes: ["GOOD_WALK", "QUIET", "LEASH_REQUIRED"],
    likesCount: 7,
  },
  {
    id: "review-8",
    placeId: "place-2",
    placeName: "계족산 황톳길",
    authorId: "user-2",
    text: "보리와 걷기 좋았지만 일부 구간은 계단이 많아 돌아갔어요. 물은 따로 챙기는 게 편했습니다.",
    tagCodes: ["GOOD_WALK", "MANY_STAIRS"],
    likesCount: 2,
  },
  {
    id: "review-9",
    placeId: "place-4",
    placeName: "유성 반려동물 놀이터",
    authorId: "user-5",
    text: "대형견 구역이 분리돼 있어 초코가 편하게 뛰었어요. 한낮에는 그늘이 적었습니다.",
    tagCodes: ["LARGE_DOG_ZONE", "LACK_SHADE"],
    likesCount: 14,
  },
  {
    id: "review-10",
    placeId: "place-5",
    placeName: "댕댕 베이커리",
    authorId: "user-7",
    text: "마루와 함께 실내에서 쉬었어요. 반려견 간식 종류가 있어 성분표를 확인하고 골랐습니다.",
    tagCodes: ["INDOOR_ALLOWED", "PET_MENU", "PET_FRIENDLY_STAFF"],
    likesCount: 8,
  },
  {
    id: "review-11",
    placeId: "place-6",
    placeName: "대흥동 감성 카페",
    authorId: "user-8",
    text: "비 오는 날 별이와 방문했어요. 조용한 자리는 편했지만 소형견 동반 조건은 방문 전에 다시 확인했어요.",
    tagCodes: ["SMALL_DOG_ONLY", "COMFY_SEATING", "QUIET"],
    likesCount: 1,
  },
  {
    id: "review-12",
    placeId: "place-7",
    placeName: "성심당 본점",
    authorId: "user-3",
    text: "매장 안에는 몽이를 데려갈 수 없어 동행인이 포장해 왔어요. 반려견 동반 방문 계획이라면 이 점을 먼저 확인하세요.",
    tagCodes: ["NOISY"],
    likesCount: 5,
  },
  {
    id: "review-13",
    placeId: "place-9",
    placeName: "엑스포과학공원",
    authorId: "user-1",
    text: "콩이와 야외 구역을 걸었어요. 사진 찍기 좋은 곳이 많지만 실내 시설은 동반 조건을 따로 확인해야 합니다.",
    tagCodes: ["GOOD_WALK", "PHOTO_SPOT"],
    likesCount: 10,
  },
  {
    id: "review-14",
    placeId: "place-10",
    placeName: "유성온천 족욕체험장",
    authorId: "user-4",
    text: "두부와 실외 구역만 둘러봤어요. 사람이 많은 시간에는 잠깐 머물다 나오는 편이 낫겠습니다.",
    tagCodes: ["NOISY", "PHOTO_SPOT"],
    likesCount: 0,
  },
  {
    id: "review-15",
    placeId: "place-11",
    placeName: "장태산자연휴양림",
    authorId: "user-2",
    text: "숲길 그늘이 좋아 보리와 오래 걸었습니다. 주말 주차 공간은 넉넉하지 않았어요.",
    tagCodes: ["SHADY", "GOOD_VIEW", "PARKING_HARD"],
    likesCount: 16,
  },
  {
    id: "review-16",
    placeId: "place-12",
    placeName: "대전오월드",
    authorId: "user-7",
    text: "마루와 야외 구역만 이용했어요. 방문 가능한 구역을 입구에서 먼저 확인하니 동선 잡기가 쉬웠습니다.",
    tagCodes: ["GOOD_WALK", "PHOTO_SPOT"],
    likesCount: 3,
  },
  {
    id: "review-1",
    placeId: "place-1",
    placeName: "한밭수목원",
    authorId: "user-1",
    text: "물가 산책로가 넓어서 콩이가 신나게 뛰어다녔어요. 목줄은 필수지만 사람도 적당히 붐벼서 좋았습니다.",
    tagCodes: ["GOOD_WALK", "WATER_BOWL"],
    likesCount: 6,
  },
  {
    id: "review-2",
    placeId: "place-4",
    placeName: "유성 반려동물 놀이터",
    authorId: "user-2",
    text: "대형견 구역이 따로 있어서 안심하고 풀어놓을 수 있었어요. 그늘이 부족한 게 아쉬워요.",
    tagCodes: ["LARGE_DOG_ZONE", "LACK_SHADE"],
    likesCount: 3,
  },
  {
    id: "review-3",
    placeId: "place-6",
    placeName: "대흥동 감성 카페",
    authorId: "user-3",
    text: "소형견만 가능하다는 걸 미리 안내해줘서 헷갈리지 않았어요. 자리도 편안했습니다.",
    tagCodes: ["SMALL_DOG_ONLY", "COMFY_SEATING"],
    likesCount: 4,
  },
  {
    id: "review-4",
    placeId: "place-2",
    placeName: "계족산 황톳길",
    authorId: "user-5",
    text: "맨발로 걷는 사람들 사이에서 초코도 신나게 걸었어요. 배변봉투 비치돼 있어서 편했어요.",
    tagCodes: ["GOOD_WALK", "WASTE_BAG_PROVIDED", "GOOD_VIEW"],
    likesCount: 9,
  },
  {
    id: "review-5",
    placeId: "place-11",
    placeName: "장태산자연휴양림",
    authorId: "user-5",
    text: "편백숲이라 그런지 그늘도 많고 공기가 정말 좋았어요. 주차가 주말엔 좀 힘들 수 있어요.",
    tagCodes: ["SHADY", "GOOD_VIEW", "PARKING_HARD"],
    likesCount: 11,
  },
  {
    id: "review-6",
    placeId: "place-10",
    placeName: "유성온천 족욕체험장",
    authorId: "user-8",
    text: "실외 구역만 가능하지만 별이는 발 담그는 사람들 구경하는 것만으로도 좋아했어요.",
    tagCodes: ["QUIET", "PHOTO_SPOT"],
    likesCount: 5,
  },
];

reviews.push(
  { id: "review-17", placeId: "place-1", placeName: "한밭수목원", authorId: "user-8", text: "별이가 한적한 길에서는 잘 걸었어요. 주말 오후에는 사람이 많아 짧게 둘러봤습니다.", tagCodes: ["GOOD_WALK", "NOISY"], likesCount: 2 },
  { id: "review-18", placeId: "place-2", placeName: "계족산 황톳길", authorId: "user-6", text: "산체와 걷기 좋은 구간이 있었지만 비 온 다음 날은 미끄러운 곳이 있어 조심했습니다.", tagCodes: ["GOOD_WALK", "SLIPPERY_FLOOR"], likesCount: 4 },
  { id: "review-19", placeId: "place-3", placeName: "대청호 오백리길", authorId: "user-2", text: "호수 전망이 좋고 보리와 천천히 걷기 편했어요. 길이 길어 물과 쉬는 시간을 넉넉히 잡았습니다.", tagCodes: ["GOOD_VIEW", "GOOD_WALK"], likesCount: 18 },
  { id: "review-20", placeId: "place-4", placeName: "유성 반려동물 놀이터", authorId: "user-1", text: "콩이는 작은 개 구역에서 놀았어요. 구역이 나뉘어 있어 다른 크기의 반려견과 동선이 겹치지 않았습니다.", tagCodes: ["LARGE_DOG_ZONE", "GRASS_FIELD"], likesCount: 5 },
  { id: "review-21", placeId: "place-5", placeName: "댕댕 베이커리", authorId: "user-3", text: "몽이와 실내에서 쉬면서 간식을 골랐어요. 직원이 반려견 동반 안내를 친절하게 해주셨습니다.", tagCodes: ["INDOOR_ALLOWED", "PET_MENU", "KIND_STAFF"], likesCount: 12 },
  { id: "review-22", placeId: "place-5", placeName: "댕댕 베이커리", authorId: "user-4", text: "두부와 잠깐 들렀어요. 사람이 몰리는 시간에는 자리가 적을 수 있어요.", tagCodes: ["INDOOR_ALLOWED", "NOISY"], likesCount: 1 },
  { id: "review-23", placeId: "place-6", placeName: "대흥동 감성 카페", authorId: "user-7", text: "마루와 편하게 앉아 쉴 수 있었어요. 소형견 동반 조건은 방문 전에 확인했습니다.", tagCodes: ["SMALL_DOG_ONLY", "COMFY_SEATING"], likesCount: 6 },
  { id: "review-24", placeId: "place-7", placeName: "성심당 본점", authorId: "user-4", text: "두부와 함께 매장 안에 들어갈 수 없어 동행인이 포장을 맡았어요. 대기 줄이 길었습니다.", tagCodes: ["NOISY"], likesCount: 9 },
  { id: "review-25", placeId: "place-9", placeName: "엑스포과학공원", authorId: "user-5", text: "초코와 야외 공간을 산책했어요. 사진 찍기 좋지만 실내 동반은 별도로 확인해야 합니다.", tagCodes: ["PHOTO_SPOT", "GOOD_WALK"], likesCount: 7 },
  { id: "review-26", placeId: "place-10", placeName: "유성온천 족욕체험장", authorId: "user-3", text: "몽이와 실외 구역만 이용했습니다. 사람이 적은 시간에는 조용히 둘러보기 좋아요.", tagCodes: ["QUIET", "PHOTO_SPOT"], likesCount: 3 },
  { id: "review-27", placeId: "place-11", placeName: "장태산자연휴양림", authorId: "user-6", text: "산체와 그늘진 길을 걸었어요. 주말에는 주차 공간을 찾는 데 시간이 걸렸습니다.", tagCodes: ["SHADY", "PARKING_HARD"], likesCount: 11 },
  { id: "review-28", placeId: "place-11", placeName: "장태산자연휴양림", authorId: "user-1", text: "콩이와 짧은 산책로만 돌았어요. 사진 찍을 곳이 많고 숲 그늘도 넉넉했습니다.", tagCodes: ["SHADY", "PHOTO_SPOT"], likesCount: 4 },
  { id: "review-29", placeId: "place-12", placeName: "대전오월드", authorId: "user-4", text: "두부와 야외 구역을 둘러봤어요. 입장 전에 동반 가능한 구역을 안내받는 편이 좋겠습니다.", tagCodes: ["GOOD_WALK", "PHOTO_SPOT"], likesCount: 8 },
  { id: "review-30", placeId: "place-3", placeName: "대청호 오백리길", authorId: "user-5", text: "초코와 호숫길을 걸었어요. 넓은 길이 좋았지만 해가 강한 날에는 일찍 움직이는 편이 낫습니다.", tagCodes: ["GOOD_VIEW", "LACK_SHADE"], likesCount: 14 },
);

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { nickname: user.nickname, email: user.email },
      create: { id: user.id, email: user.email, nickname: user.nickname },
    });
  }

  for (const pet of pets) {
    await prisma.pet.upsert({
      where: { id: pet.id },
      update: {
        name: pet.name,
        breed: pet.breed,
        weightKg: pet.weightKg,
        ageYears: pet.ageYears,
        size: pet.size,
        emoji: pet.emoji,
        mbtiCode: pet.mbtiCode,
        mbtiName: pet.mbtiName,
        mbtiTheme: pet.mbtiTheme,
        mbtiTraits: pet.mbtiTraits,
      },
      create: {
        id: pet.id,
        userId: pet.userId,
        name: pet.name,
        breed: pet.breed,
        weightKg: pet.weightKg,
        ageYears: pet.ageYears,
        size: pet.size,
        emoji: pet.emoji,
        mbtiCode: pet.mbtiCode,
        mbtiName: pet.mbtiName,
        mbtiTheme: pet.mbtiTheme,
        mbtiTraits: pet.mbtiTraits,
      },
    });
  }

  for (const course of courses) {
    // upsert는 nested create를 update 쪽에서 안 건드리므로, 다시 심을 때 하위 행이 중복되지 않게
    // 코스를 지웠다가(cascade로 day/stop/schedule도 같이 지워짐) 새로 만든다.
    await prisma.course.deleteMany({ where: { id: course.id } });
    await prisma.course.create({
      data: {
        id: course.id,
        label: course.label,
        emoji: course.emoji ?? null,
        nights: course.nights,
        transport: course.transport,
        source: course.source,
        shared: course.shared,
        userId: course.userId,
        days: {
          create: course.days.map((stops, dayIndex) => ({
            dayIndex,
            stops: {
              create: stops.map((s, order) => ({ ...s, order })),
            },
          })),
        },
        ...(course.schedule
          ? {
              schedules: {
                create: {
                  date: course.schedule.date,
                  festivalTitles: {
                    create: course.schedule.festivalTitles.map((title) => ({ title })),
                  },
                },
              },
            }
          : {}),
      },
    });
  }

  for (const post of posts) {
    const createdAt = new Date(Date.now() - post.daysAgo * 24 * 60 * 60 * 1000);
    await prisma.post.deleteMany({ where: { id: post.id } });
    await prisma.post.create({
      data: {
        id: post.id,
        caption: post.caption,
        text: post.text,
        tags: post.tags,
        authorName: post.authorName,
        authorEmoji: post.authorEmoji,
        petTypeName: post.petTypeName,
        likes: post.likes,
        saves: post.saves,
        createdAt,
        userId: post.userId,
        courseId: post.courseId ?? null,
        stops: { create: post.stops.map((s, order) => ({ ...s, order })) },
      },
    });
  }

  for (const tag of reviewTagOptions) {
    await prisma.reviewTagOption.upsert({
      where: { code: tag.code },
      update: { label: tag.label, category: tag.category, sortOrder: tag.sortOrder },
      create: tag,
    });
  }

  for (const review of reviews) {
    await prisma.review.deleteMany({ where: { id: review.id } });
    await prisma.review.create({
      data: {
        id: review.id,
        placeId: review.placeId,
        placeName: review.placeName,
        text: review.text,
        likesCount: review.likesCount,
        authorId: review.authorId,
        tags: { create: review.tagCodes.map((code) => ({ tag: { connect: { code } } })) },
      },
    });
  }

  console.log(
    `✅ 시드 완료: 사용자 ${users.length}명, 반려동물 ${pets.length}마리, 코스 ${courses.length}개, ` +
      `둘러보기 게시물 ${posts.length}개, 후기 태그 ${reviewTagOptions.length}개, 후기 ${reviews.length}개`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
