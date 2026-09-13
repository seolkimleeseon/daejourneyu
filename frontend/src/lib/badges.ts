import type {
  Course,
  CourseSchedule,
  CourseStop,
  DaejeonDistrict,
  FeedPost,
  Pet,
  Place,
  PlaceCategory,
  Review,
} from "@/types";

/**
 * 뱃지 식별자. `name`은 화면에 보이는 카피라서 언제든 바뀔 수 있으므로 key·정렬·저장에는
 * 이 값을 쓴다. 뱃지를 추가할 때 여기에 먼저 넣으면 정의 배열 쪽 누락을 타입이 잡아준다.
 */
export type BadgeId =
  // 발도장
  | "dj-full-round"
  | "landmark-gapcheon"
  | "landmark-gyejoksan"
  | "landmark-ppurigongwon"
  | "landmark-jangtaesan"
  | "landmark-sikjangsan"
  | "one-day-expedition"
  | "even-traveler"
  // 단계형
  | "traveler"
  | "course-maker"
  | "collector"
  | "popular-course"
  | "review-king"
  | "photographer"
  | "neighbor-love"
  // 취향
  | "no-picky"
  | "walk-mania"
  | "gourmet"
  | "playground-regular"
  | "culture-life"
  | "careful-owner"
  | "all-breeds"
  // 여행법
  | "car-lover"
  | "walker"
  | "one-more-night"
  | "packed-day"
  | "slow-day"
  | "early-planner"
  // 반려동물
  | "pet-mbti"
  | "mbti-explorer"
  | "by-type"
  | "pet-profile"
  // 시작
  | "first-owner"
  | "dog-friend"
  | "first-journey"
  // 한정
  | "festival-zero"
  | "festival-science"
  | "spring-blossom"
  | "autumn-gyejoksan"
  | "winter-walk"
  | "service-birthday"
  // 히든
  | "night-walker"
  | "hundred-stamps"
  | "rain-walker";

/**
 * 뱃지 계열. 여행을 많이 다니는 사람·글을 많이 쓰는 사람·한 동네만 파는 사람이 각자 다른
 * 뱃지를 모으도록 축을 갈라둔 것이라, 한 계열에 몰리면 다시 온보딩 체크리스트가 된다.
 * 전체 목록 화면(/my/badges)의 섹션 순서가 곧 이 배열의 순서다.
 */
export type BadgeCategory =
  | "발도장"
  | "단계형"
  | "취향"
  | "여행법"
  | "반려동물"
  | "시작"
  | "한정"
  | "히든";

export const BADGE_CATEGORIES: BadgeCategory[] = [
  "발도장",
  "단계형",
  "취향",
  "여행법",
  "반려동물",
  "시작",
  "한정",
  "히든",
];

/** 1 흔함 · 2 보통 · 3 귀함 · 4 전설. 이름표가 아니라 설계 도구다 — 흔함만 잔뜩이면 시시해진다. */
export type BadgeRarity = 1 | 2 | 3 | 4;

export const RARITY_LABEL: Record<BadgeRarity, string> = {
  1: "흔함",
  2: "보통",
  3: "귀함",
  4: "전설",
};

/**
 * 명소 뱃지가 가리키는 실제 장소 id. 한 명소가 소스마다 여러 레코드로 들어와 있어서 배열이다
 * (예: "계족산"과 "계족산 황톳길"이 각각 한 줄).
 *
 * 이름 문자열로 맞추면 관광 API 표기가 바뀔 때 조용히 깨지므로 id를 박아둔다. 값은 실 DB의
 * `/api/places` 응답에서 확인한 것이고, `place-2`는 백엔드가 안 떠 있을 때 쓰이는
 * `mockPlaces` 쪽 계족산이다 — 두 출처를 같이 넣어둬야 목데이터 폴백에서도 뱃지가 살아난다.
 *
 * ⚠ `petacp-*`는 `backend/scripts/syncPlaces.ts`가 CSV 순번(`petacp-${index}`)으로 만드는 id라
 * 소스 CSV의 줄 순서가 바뀌면 다른 장소를 가리키게 된다. `npm run sync:places`를 다시 돌린
 * 뒤에는 갑천 항목이 여전히 유성구 갑천근린공원인지 확인할 것. 나머지 접두사(pettour·tourspot·
 * petfac·camp·park)는 원본 소스의 id를 그대로 쓰므로 재동기화에도 유지된다.
 */
export const LANDMARK_PLACE_IDS: Record<string, string[]> = {
  gapcheon: ["petacp-2"],
  gyejoksan: ["tourspot-9", "tourspot-122", "place-2"],
  ppurigongwon: ["pettour-126838", "tourspot-26"],
  jangtaesan: ["petfac-22", "camp-8"],
  sikjangsan: ["petfac-19", "tourspot-120"],
};

/**
 * 서비스 오픈일(MM-DD). 확정 전이라 비워둔다 — 채우는 순간 '대저니유 생일'이 살아난다.
 * 임의의 날짜를 넣어두면 아무도 못 따는 뱃지가 조용히 생기므로 추측해서 채우지 않는다.
 */
const SERVICE_OPEN_MMDD: string | null = null;

export interface Badge {
  id: BadgeId;
  emoji: string;
  /** 단계형이면 "후기왕 Lv.2"처럼 레벨이 붙은 완성형 이름 */
  name: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  /** 획득분에 보여줄 짧은 라벨 */
  description: string;
  /** 아직 못 받은 뱃지에 보여줄 획득 조건. 그 자체로 할 일이 되므로 문장으로 쓴다. */
  how: string;
  got: boolean;
  /** 단계형만 1 이상. 아직 Lv.1도 못 딴 단계형은 0 */
  level: number;
  /** 단계가 없는 뱃지는 1 */
  maxLevel: number;
  /** 이번 단계 진행값 */
  current: number;
  /** 이번 단계 목표값. 만렙이면 마지막 임계값 그대로 */
  target: number;
  /** 미획득 상태에서 이름·조건을 감춘다 */
  hidden: boolean;
  /** 4열 타일에 들어가는 한 줄 라벨 */
  tileLabel: string;
  /** 남은 거리 줄과 목록에서 "다음 걸음"으로 여는 화면 */
  href?: string;
}

export interface BadgeInput {
  isLoggedIn: boolean;
  pets: Pet[];
  activePet: Pet | null;
  courses: Course[];
  schedules: CourseSchedule[];
  reviews: Review[];
  posts: FeedPost[];
  places: Place[];
  /** YYYY-MM-DD. 날짜가 지난 일정만 '다녀온' 것으로 친다 */
  today: string;
}

/** 정의 함수들이 실제로 읽는 값. 매 뱃지마다 같은 집계를 다시 돌지 않도록 한 번만 만든다. */
interface BadgeFacts extends BadgeInput {
  /** 날짜가 지난 일정과 그 코스 */
  visited: { schedule: CourseSchedule; course: Course }[];
  /** 다녀온 코스의 모든 방문 지점. 같은 곳을 두 번 가면 2회로 센다 */
  stops: CourseStop[];
  districtCount: Map<DaejeonDistrict, number>;
  categoryCount: Map<PlaceCategory, number>;
  placeById: Map<string, Place>;
  myReviews: Review[];
}

interface BadgeDef {
  id: BadgeId;
  emoji: string;
  name: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  description: string;
  how: string;
  hidden?: boolean;
  href?: string;
  /**
   * 오름차순 임계값. 길이가 2 이상이면 단계형이라 이름에 Lv가 붙는다.
   * 단계를 이름에 접어 넣기 때문에 후기 1개/10개/30개가 뱃지 3종이 아니라 1종으로 남는다.
   */
  tiers: number[];
  measure: (facts: BadgeFacts) => number;
}

const ALL_DISTRICTS: DaejeonDistrict[] = ["유성구", "중구", "동구", "대덕구", "서구"];

function countBy<K>(keys: K[]): Map<K, number> {
  const map = new Map<K, number>();
  for (const key of keys) map.set(key, (map.get(key) ?? 0) + 1);
  return map;
}

/** "YYYY-MM-DD"에서 월만 뽑는다. Date 파싱은 타임존 때문에 하루씩 밀리므로 문자열로 자른다. */
function monthOf(date: string): number {
  return Number(date.slice(5, 7));
}

function buildFacts(input: BadgeInput): BadgeFacts {
  const courseById = new Map(input.courses.map((course) => [course.id, course]));

  // '방문'은 체크인·인증샷 대신 일정 날짜로 판정한다 — 마찰이 없고 이미 갖고 있는 데이터다.
  // 오늘 날짜의 일정도 인정한다. 여행에서 막 돌아온 사람이 하루를 더 기다려야 할 이유가 없다.
  const visited = input.schedules
    .filter((schedule) => schedule.date <= input.today)
    .map((schedule) => ({ schedule, course: courseById.get(schedule.courseId) }))
    .filter(
      (entry): entry is { schedule: CourseSchedule; course: Course } => entry.course !== undefined
    );

  const stops = visited.flatMap((entry) => entry.course.days.flat());

  return {
    ...input,
    visited,
    stops,
    districtCount: countBy(stops.map((stop) => stop.district)),
    categoryCount: countBy(stops.map((stop) => stop.category)),
    placeById: new Map(input.places.map((place) => [place.id, place])),
    myReviews: input.reviews.filter((review) => review.isMine),
  };
}

/** 다녀온 지점 중 명소 id에 해당하는 것이 있으면 1. 아직 id를 모르는 명소는 항상 0이다. */
function visitedLandmark(facts: BadgeFacts, key: string): number {
  const ids = LANDMARK_PLACE_IDS[key] ?? [];
  if (ids.length === 0) return 0;
  return facts.stops.some((stop) => ids.includes(stop.placeId)) ? 1 : 0;
}

/** 다녀온 코스 중 조건을 만족하는 게 하나라도 있으면 1. 1회성 뱃지의 공통 형태다. */
function anyVisitedCourse(facts: BadgeFacts, match: (course: Course) => boolean): number {
  return facts.visited.some((entry) => match(entry.course)) ? 1 : 0;
}

/** 아직 못 밟은 구. '남은 거리' 카피에서 이름을 직접 부르는 데 쓴다. */
function missingDistricts(facts: BadgeFacts): DaejeonDistrict[] {
  return ALL_DISTRICTS.filter((district) => !facts.districtCount.has(district));
}

const BADGE_DEFS: BadgeDef[] = [
  // ===== 발도장 — 이 앱에서만 나올 수 있는 계열 =====
  {
    id: "dj-full-round",
    emoji: "🐾",
    name: "대전 한바퀴",
    category: "발도장",
    rarity: 3,
    description: "5개 구 완주",
    how: "대전 5개 구를 모두 다녀오면 도장판이 완성돼요",
    href: "/map",
    tiers: [5],
    measure: (facts) => facts.districtCount.size,
  },
  {
    id: "landmark-gapcheon",
    emoji: "🏞️",
    name: "갑천 노을길",
    category: "발도장",
    rarity: 1,
    description: "유성 명소",
    how: "유성구 갑천 산책로를 다녀와보세요",
    tiers: [1],
    measure: (facts) => visitedLandmark(facts, "gapcheon"),
  },
  {
    id: "landmark-gyejoksan",
    emoji: "⛰️",
    name: "계족산 맨발",
    category: "발도장",
    rarity: 2,
    description: "대덕 명소",
    how: "대덕구 계족산 황톳길을 다녀와보세요",
    tiers: [1],
    measure: (facts) => visitedLandmark(facts, "gyejoksan"),
  },
  {
    id: "landmark-ppurigongwon",
    emoji: "🌰",
    name: "뿌리공원 나들이",
    category: "발도장",
    rarity: 2,
    description: "중구 명소",
    how: "중구 뿌리공원을 다녀와보세요",
    tiers: [1],
    measure: (facts) => visitedLandmark(facts, "ppurigongwon"),
  },
  {
    id: "landmark-jangtaesan",
    emoji: "🌲",
    name: "장태산 숲멍",
    category: "발도장",
    rarity: 3,
    description: "서구 명소",
    how: "서구 장태산 자연휴양림을 다녀와보세요",
    tiers: [1],
    measure: (facts) => visitedLandmark(facts, "jangtaesan"),
  },
  {
    id: "landmark-sikjangsan",
    emoji: "🌄",
    name: "식장산 전망대",
    category: "발도장",
    rarity: 3,
    description: "동구 명소",
    how: "동구 식장산에 올라보세요",
    tiers: [1],
    measure: (facts) => visitedLandmark(facts, "sikjangsan"),
  },
  {
    id: "one-day-expedition",
    emoji: "🚩",
    name: "하루 원정대",
    category: "발도장",
    rarity: 3,
    description: "하루 3개 구",
    how: "하루 코스에 서로 다른 구를 세 곳 담아 다녀와보세요",
    tiers: [3],
    measure: (facts) =>
      Math.max(
        0,
        ...facts.visited.flatMap((entry) =>
          entry.course.days.map((day) => new Set(day.map((stop) => stop.district)).size)
        )
      ),
  },
  {
    id: "even-traveler",
    emoji: "🗺️",
    name: "골고루 여행자",
    category: "발도장",
    rarity: 4,
    description: "5개 구 2회씩",
    how: "대전 5개 구를 각각 두 번 이상 다녀와보세요",
    tiers: [5],
    measure: (facts) =>
      ALL_DISTRICTS.filter((district) => (facts.districtCount.get(district) ?? 0) >= 2).length,
  },

  // ===== 단계형 — 천장이 없는 축 =====
  {
    id: "traveler",
    emoji: "🧳",
    name: "여행러",
    category: "단계형",
    rarity: 1,
    description: "다녀온 일정",
    how: "코스에 날짜를 붙여 다녀오면 쌓여요",
    href: "/schedule",
    tiers: [1, 5, 15, 30, 50],
    measure: (facts) => facts.visited.length,
  },
  {
    id: "course-maker",
    emoji: "🗺️",
    name: "코스 메이커",
    category: "단계형",
    rarity: 1,
    description: "직접 만든 코스",
    how: "내 여정에서 코스를 직접 만들어보세요",
    href: "/schedule",
    tiers: [1, 5, 15],
    measure: (facts) => facts.courses.filter((course) => course.source === "manual").length,
  },
  {
    id: "collector",
    emoji: "🔖",
    name: "수집가",
    category: "단계형",
    rarity: 2,
    description: "보관한 코스",
    how: "마음에 드는 남의 코스를 보관함에 담아보세요",
    href: "/feed",
    tiers: [3, 10, 30],
    measure: (facts) => facts.courses.filter((course) => course.source === "saved").length,
  },
  {
    id: "popular-course",
    emoji: "🌟",
    name: "인기 코스",
    category: "단계형",
    rarity: 3,
    description: "받은 좋아요",
    how: "둘러보기에 공유한 코스가 좋아요를 받으면 쌓여요",
    href: "/feed",
    tiers: [10, 50, 200],
    measure: (facts) =>
      facts.posts
        .filter((post) => post.isMine)
        .reduce((sum, post) => sum + post.likes, 0),
  },
  {
    id: "review-king",
    emoji: "✍️",
    name: "후기왕",
    category: "단계형",
    rarity: 1,
    description: "쓴 후기",
    how: "다녀온 장소에 후기를 남기면 쌓여요",
    href: "/my/reviews",
    tiers: [1, 10, 30],
    measure: (facts) => facts.myReviews.length,
  },
  {
    id: "photographer",
    emoji: "📸",
    name: "사진사",
    category: "단계형",
    rarity: 2,
    description: "사진 붙인 후기",
    how: "후기에 사진을 함께 올리면 쌓여요",
    href: "/my/reviews",
    tiers: [1, 10, 30],
    measure: (facts) => facts.myReviews.filter((review) => !!review.photoUrl).length,
  },
  {
    id: "neighbor-love",
    emoji: "💚",
    name: "이웃사랑",
    category: "단계형",
    rarity: 1,
    description: "누른 좋아요",
    how: "둘러보기에서 남의 게시물에 좋아요를 눌러보세요",
    href: "/feed",
    tiers: [10, 50, 200],
    measure: (facts) => facts.posts.filter((post) => !post.isMine && post.liked).length,
  },

  // ===== 취향 — 어떤 장소를 좋아하는지가 뱃지가 된다 =====
  {
    id: "no-picky",
    emoji: "🍽️",
    name: "편식 없는 여행자",
    category: "취향",
    rarity: 2,
    description: "4종 제패",
    how: "산책·놀이터·맛집·문화를 모두 다녀와보세요",
    tiers: [4],
    measure: (facts) => facts.categoryCount.size,
  },
  {
    id: "walk-mania",
    emoji: "🏞️",
    name: "산책 마니아",
    category: "취향",
    rarity: 2,
    description: "산책 10곳",
    how: "산책 장소를 열 곳 다녀와보세요",
    tiers: [10],
    measure: (facts) => facts.categoryCount.get("산책") ?? 0,
  },
  {
    id: "gourmet",
    emoji: "🍚",
    name: "댕댕 미식가",
    category: "취향",
    rarity: 2,
    description: "맛집 10곳",
    how: "반려동물 동반 맛집을 열 곳 다녀와보세요",
    tiers: [10],
    measure: (facts) => facts.categoryCount.get("맛집") ?? 0,
  },
  {
    id: "playground-regular",
    emoji: "🤸",
    name: "놀이터 죽순이",
    category: "취향",
    rarity: 2,
    description: "놀이터 5곳",
    how: "반려동물 놀이터를 다섯 곳 다녀와보세요",
    tiers: [5],
    measure: (facts) => facts.categoryCount.get("놀이터") ?? 0,
  },
  {
    id: "culture-life",
    emoji: "🎨",
    name: "문화생활",
    category: "취향",
    rarity: 3,
    description: "문화 5곳",
    how: "동반 가능한 문화 공간을 다섯 곳 다녀와보세요",
    tiers: [5],
    measure: (facts) => facts.categoryCount.get("문화") ?? 0,
  },
  {
    id: "careful-owner",
    emoji: "🐕‍🦺",
    name: "조심성 있는 보호자",
    category: "취향",
    rarity: 3,
    description: "소형견 전용 3곳",
    how: "소형견 전용 조건이 붙은 장소를 세 곳 다녀와보세요",
    tiers: [3],
    measure: (facts) =>
      new Set(
        facts.stops
          .filter((stop) => facts.placeById.get(stop.placeId)?.smallDogOnly === true)
          .map((stop) => stop.placeId)
      ).size,
  },
  {
    id: "all-breeds",
    emoji: "🦮",
    name: "전 견종 환영",
    category: "취향",
    rarity: 2,
    description: "제한 없는 5곳",
    how: "견종 제한이 없는 장소를 다섯 곳 다녀와보세요",
    tiers: [5],
    // 구조화된 필드가 smallDogOnly뿐이라 그것으로만 가른다. condition 문자열을 파싱하면
    // 표기가 바뀔 때 조용히 깨지므로 쓰지 않는다 — TODO(api): 동반 조건을 플래그로 분리.
    measure: (facts) =>
      new Set(
        facts.stops
          .filter((stop) => {
            const place = facts.placeById.get(stop.placeId);
            return place !== undefined && place.smallDogOnly !== true;
          })
          .map((stop) => stop.placeId)
      ).size,
  },

  // ===== 여행법 — 더 많이 다닌 사람이 아니라 다르게 다닌 사람에게 =====
  {
    id: "car-lover",
    emoji: "🚗",
    name: "자차파",
    category: "여행법",
    rarity: 1,
    description: "자차 5회",
    how: "자차 코스로 다섯 번 다녀와보세요",
    tiers: [5],
    measure: (facts) => facts.visited.filter((entry) => entry.course.transport === "자차").length,
  },
  {
    id: "walker",
    emoji: "🚌",
    name: "뚜벅이",
    category: "여행법",
    rarity: 3,
    description: "대중교통 5회",
    how: "대중교통 코스로 다섯 번 다녀와보세요",
    tiers: [5],
    measure: (facts) =>
      facts.visited.filter((entry) => entry.course.transport === "대중교통").length,
  },
  {
    id: "one-more-night",
    emoji: "🌙",
    name: "하룻밤 더",
    category: "여행법",
    rarity: 2,
    description: "1박 이상",
    how: "1박 이상 코스를 다녀와보세요",
    tiers: [1],
    measure: (facts) => anyVisitedCourse(facts, (course) => course.nights >= 1),
  },
  {
    id: "packed-day",
    emoji: "🔥",
    name: "알차게",
    category: "여행법",
    rarity: 3,
    description: "하루 5곳",
    how: "하루에 다섯 곳 이상 담은 코스를 다녀와보세요",
    tiers: [1],
    measure: (facts) =>
      anyVisitedCourse(facts, (course) => course.days.some((day) => day.length >= 5)),
  },
  {
    id: "slow-day",
    emoji: "🐢",
    name: "느긋하게",
    category: "여행법",
    rarity: 2,
    description: "하루 2곳 이하",
    how: "하루 두 곳 이하로 여유 있게 다녀와보세요",
    tiers: [1],
    measure: (facts) =>
      anyVisitedCourse(facts, (course) =>
        course.days.some((day) => day.length > 0 && day.length <= 2)
      ),
  },
  {
    id: "early-planner",
    emoji: "📆",
    name: "계획러",
    category: "여행법",
    rarity: 3,
    description: "30일 전 예약",
    how: "30일 이상 앞서 잡아둔 일정을 실제로 다녀와보세요",
    tiers: [1],
    // TODO(api): Course·CourseSchedule에 createdAt이 없어 '언제 잡았는지'를 알 수 없다.
    // 필드가 생기면 schedule.date - schedule.createdAt >= 30일로 판정한다.
    measure: () => 0,
  },

  // ===== 반려동물 — 여행을 안 가도 딸 수 있는 유일한 축 =====
  {
    id: "pet-mbti",
    emoji: "✨",
    name: "MBTI 진단",
    category: "반려동물",
    rarity: 1,
    description: "성향 완료",
    how: "반려동물 MBTI 퀴즈를 끝까지 풀어보세요",
    href: "/schedule/course/new/mbti",
    tiers: [1],
    measure: (facts) => (facts.activePet?.mbti ? 1 : 0),
  },
  {
    id: "mbti-explorer",
    emoji: "🧬",
    name: "유형 탐구",
    category: "반려동물",
    rarity: 3,
    description: "2마리 진단",
    how: "반려동물 두 마리 이상의 MBTI를 진단해보세요",
    tiers: [2],
    measure: (facts) => facts.pets.filter((pet) => !!pet.mbti).length,
  },
  {
    id: "by-type",
    emoji: "🎯",
    name: "유형대로",
    category: "반려동물",
    rarity: 2,
    description: "추천 테마 완주",
    how: "MBTI가 추천한 테마의 장소를 다녀와보세요",
    tiers: [1],
    measure: (facts) => {
      const theme = facts.activePet?.mbti?.theme;
      if (!theme) return 0;
      return facts.stops.some((stop) => stop.category === theme) ? 1 : 0;
    },
  },
  {
    id: "pet-profile",
    emoji: "🏡",
    name: "프로필 완성",
    category: "반려동물",
    rarity: 1,
    description: "정보 다 채움",
    how: "이름·견종·몸무게·나이·이모지를 모두 채워보세요",
    tiers: [1],
    measure: (facts) => {
      const pet = facts.activePet;
      if (!pet) return 0;
      const filled =
        pet.name.trim() !== "" &&
        pet.breed.trim() !== "" &&
        pet.weightKg > 0 &&
        pet.ageYears > 0 &&
        pet.emoji.trim() !== "";
      return filled ? 1 : 0;
    },
  },

  // ===== 시작 — 3종만 남긴다. 더 늘리면 다시 체크리스트가 된다 =====
  {
    id: "first-owner",
    emoji: "🐾",
    name: "첫 반려인",
    category: "시작",
    rarity: 1,
    description: "가입 완료",
    how: "대저니유에 가입하면 바로 받아요",
    tiers: [1],
    measure: (facts) => (facts.isLoggedIn ? 1 : 0),
  },
  {
    id: "dog-friend",
    emoji: "🐶",
    name: "멍친구",
    category: "시작",
    rarity: 2,
    description: "2마리+",
    how: "반려동물을 두 마리 이상 등록해보세요",
    href: "/onboarding/pet-register?from=my",
    tiers: [2],
    measure: (facts) => facts.pets.length,
  },
  {
    id: "first-journey",
    emoji: "🧭",
    name: "첫 여정",
    category: "시작",
    rarity: 1,
    description: "일정 등록",
    how: "코스에 날짜를 붙여 내 여정에 등록해보세요",
    href: "/schedule",
    tiers: [1],
    measure: (facts) => facts.schedules.length,
  },

  // ===== 한정 — 기간이 지나면 영영 못 따는, 희소성이 생기는 유일한 계열 =====
  {
    id: "festival-zero",
    emoji: "🎪",
    name: "0시축제 2026",
    category: "한정",
    rarity: 3,
    description: "시즌 한정",
    how: "0시축제 기간에 중구 일정을 다녀와보세요",
    tiers: [1],
    measure: (facts) =>
      facts.visited.some(
        (entry) =>
          entry.schedule.festivalTitles.some((title) => title.includes("0시")) &&
          entry.course.days.flat().some((stop) => stop.district === "중구")
      )
        ? 1
        : 0,
  },
  {
    id: "festival-science",
    emoji: "🎆",
    name: "사이언스 페스티벌",
    category: "한정",
    rarity: 3,
    description: "시즌 한정",
    how: "사이언스 페스티벌 기간에 유성구 일정을 다녀와보세요",
    tiers: [1],
    measure: (facts) =>
      facts.visited.some(
        (entry) =>
          entry.schedule.festivalTitles.some((title) => title.includes("사이언스")) &&
          entry.course.days.flat().some((stop) => stop.district === "유성구")
      )
        ? 1
        : 0,
  },
  {
    id: "spring-blossom",
    emoji: "🌸",
    name: "봄 벚꽃",
    category: "한정",
    rarity: 2,
    description: "시즌 한정",
    how: "4월에 산책 장소를 다녀와보세요",
    tiers: [1],
    measure: (facts) =>
      facts.visited.some(
        (entry) =>
          monthOf(entry.schedule.date) === 4 &&
          entry.course.days.flat().some((stop) => stop.category === "산책")
      )
        ? 1
        : 0,
  },
  {
    id: "autumn-gyejoksan",
    emoji: "🍁",
    name: "가을 계족산",
    category: "한정",
    rarity: 2,
    description: "시즌 한정",
    how: "9~11월에 대덕구 일정을 다녀와보세요",
    tiers: [1],
    measure: (facts) =>
      facts.visited.some((entry) => {
        const month = monthOf(entry.schedule.date);
        return (
          month >= 9 &&
          month <= 11 &&
          entry.course.days.flat().some((stop) => stop.district === "대덕구")
        );
      })
        ? 1
        : 0,
  },
  {
    id: "winter-walk",
    emoji: "❄️",
    name: "겨울 산책러",
    category: "한정",
    rarity: 3,
    description: "시즌 한정",
    how: "12~2월에 산책 장소를 다녀와보세요",
    tiers: [1],
    measure: (facts) =>
      facts.visited.some((entry) => {
        const month = monthOf(entry.schedule.date);
        return (
          (month === 12 || month <= 2) &&
          entry.course.days.flat().some((stop) => stop.category === "산책")
        );
      })
        ? 1
        : 0,
  },
  {
    id: "service-birthday",
    emoji: "🎂",
    name: "대저니유 생일",
    category: "한정",
    rarity: 4,
    description: "오픈 기념일",
    how: "대저니유 오픈 기념일에 접속해보세요",
    tiers: [1],
    measure: (facts) =>
      SERVICE_OPEN_MMDD !== null && facts.today.slice(5) === SERVICE_OPEN_MMDD ? 1 : 0,
  },

  // ===== 히든 — 서너 개가 상한. 많아지면 그냥 못 따는 칸이 된다 =====
  {
    id: "night-walker",
    emoji: "🌙",
    name: "야행성 산책러",
    category: "히든",
    rarity: 4,
    description: "조건 비공개",
    how: "조건은 비밀이에요",
    hidden: true,
    tiers: [1],
    // TODO(api): Review에 작성 시각이 없다(createdAtLabel은 "2일 전" 같은 표시용 문자열).
    measure: () => 0,
  },
  {
    id: "hundred-stamps",
    emoji: "💯",
    name: "발도장 100",
    category: "히든",
    rarity: 4,
    description: "조건 비공개",
    how: "조건은 비밀이에요",
    hidden: true,
    tiers: [100],
    measure: (facts) => facts.stops.length,
  },
  {
    id: "rain-walker",
    emoji: "🌧️",
    name: "비와도 간다",
    category: "히든",
    rarity: 4,
    description: "조건 비공개",
    how: "조건은 비밀이에요",
    hidden: true,
    tiers: [1],
    // TODO(api): 지난 날짜의 날씨 이력이 없다. useWeather는 현재 날씨만 준다.
    measure: () => 0,
  },
];

/** 오늘 날짜를 YYYY-MM-DD로. 로컬 타임존 기준이라 사용자가 보는 달력과 어긋나지 않는다. */
export function todayString(now: Date = new Date()): string {
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function toBadge(def: BadgeDef, facts: BadgeFacts): Badge {
  const value = Math.max(0, def.measure(facts));
  const maxLevel = def.tiers.length;
  const level = def.tiers.filter((tier) => value >= tier).length;
  const atMax = level >= maxLevel;
  const target = atMax ? def.tiers[maxLevel - 1] : def.tiers[level];
  const current = Math.min(value, target);
  const got = level > 0;

  // 단계는 이름에 접는다 — 후기 1개·10개·30개가 뱃지 3종이 아니라 "후기왕 Lv.2" 한 종으로 남는다.
  const leveled = maxLevel > 1;
  const name = leveled ? `${def.name} Lv.${Math.max(level, 1)}` : def.name;

  return {
    id: def.id,
    emoji: def.emoji,
    name,
    category: def.category,
    rarity: def.rarity,
    description: def.description,
    how: def.how,
    got,
    level,
    maxLevel,
    current,
    target,
    hidden: def.hidden === true,
    tileLabel: got ? (leveled ? `Lv.${level}` : def.description) : `${current}/${target}`,
    href: def.href,
  };
}

/**
 * 배열 순서 = 전체 목록 화면의 카탈로그 순서(계열별로 이웃하게 둔다).
 * 마이탭 요약 그리드는 이 순서를 그대로 쓰지 않고 획득분과 '거의 다 온 것'을 앞으로 당겨 정렬한다.
 */
export function computeMyBadges(input: BadgeInput): Badge[] {
  const facts = buildFacts(input);
  return BADGE_DEFS.map((def) => toBadge(def, facts));
}

export interface BadgeGroup {
  category: BadgeCategory;
  badges: Badge[];
  gotCount: number;
}

/**
 * 전체 목록 화면용 계열 묶음. 뱃지가 하나도 없는 계열은 빈 섹션 헤더만 남으므로 제외한다.
 * 계열 안에서는 정렬하지 않는다 — 카탈로그는 매번 같은 자리에 있어야 눈에 익는다.
 */
export function groupBadgesByCategory(badges: Badge[]): BadgeGroup[] {
  return BADGE_CATEGORIES.map((category) => {
    const inCategory = badges.filter((badge) => badge.category === category);
    return {
      category,
      badges: inCategory,
      gotCount: inCategory.filter((badge) => badge.got).length,
    };
  }).filter((group) => group.badges.length > 0);
}

/** 목표까지 몇 걸음 남았는지. 이미 딴 뱃지·만렙은 0이다. */
export function remainingSteps(badge: Badge): number {
  if (badge.level >= badge.maxLevel) return 0;
  return Math.max(0, badge.target - badge.current);
}

/** 코앞이라고 부를 거리. 이것보다 멀면 '남은 거리' 줄에 띄우지 않는다. */
const NEAR_THRESHOLD = 2;

/**
 * 마이탭 '남은 거리' 한 줄에 띄울 뱃지 하나를 고른다. 없으면 null이고, 그때 줄은 통째로 숨긴다 —
 * "아직 멀었어요" 같은 빈 상태를 항상 띄워두면 벽지가 되어 아무도 안 본다.
 *
 * 비율이 아니라 **남은 개수**로 고르는 이유: 카피가 "중구'만' 가면"처럼 개수로 말하기 때문이다.
 * 비율로 고르면 후기왕 29/30(0.97)이 대전 한바퀴 4/5(0.8)를 늘 이겨 문장과 어긋난다.
 *
 * 시작도 안 한 뱃지(current === 0)는 제외한다 — 그건 남은 거리가 아니라 그냥 추천이다.
 * 히든도 제외한다 — 조건이 비밀인데 "하나만 더"라고 하면 힌트가 새어나간다.
 *
 * `computeMyBadges`가 매 렌더 즉석 계산이라 정렬이 결정적이어야 한다. 동률에서 순서가 흔들리면
 * 리렌더마다 다른 뱃지가 떠서 버그처럼 보이므로 마지막 tie-break를 id 고정순으로 둔다.
 */
export function pickNearestBadge(badges: Badge[]): Badge | null {
  const candidates = badges.filter(
    (badge) =>
      !badge.hidden &&
      badge.level < badge.maxLevel &&
      badge.current > 0 &&
      remainingSteps(badge) <= NEAR_THRESHOLD
  );

  if (candidates.length === 0) return null;

  return [...candidates].sort((a, b) => {
    const byRemaining = remainingSteps(a) - remainingSteps(b);
    if (byRemaining !== 0) return byRemaining;
    if (a.rarity !== b.rarity) return b.rarity - a.rarity;
    return a.id.localeCompare(b.id);
  })[0];
}

/**
 * '남은 거리' 한 줄의 문장. 순서가 아니라 거리를 말한다 — "다음 뱃지"라고 부르는 순간
 * 1번 다음에 2번을 따는 단계별 진행으로 읽히고, 목록에서 "나는 몇 번째지?"를 찾게 된다.
 */
export function nearBadgeMessage(badge: Badge, input: BadgeInput): string {
  const remaining = remainingSteps(badge);

  // 대전 한바퀴는 남은 구를 이름으로 부를 수 있어 문장이 훨씬 구체적이 된다.
  if (badge.id === "dj-full-round") {
    const missing = missingDistricts(buildFacts(input));
    if (missing.length === 1) return `${missing[0]}만 가면 대전 한바퀴 완성`;
    if (missing.length === 2) return `${missing[0]}·${missing[1]} 두 곳이면 대전 한바퀴 완성`;
  }

  return `${badge.name}까지 ${remaining}개 남았어요`;
}
