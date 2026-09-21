import type {
  Article,
  Course,
  CourseSchedule,
  CourseStop,
  FeedPost,
  MbtiResult,
  Pet,
  Place,
  Review,
  User,
} from "@/types";
import type { ApiFeedPost } from "@/lib/api/posts";
import type { Badge, BadgeInput } from "@/lib/badges";

/*
 * 테스트 픽스처. 필수 필드를 매번 다 적으면 테스트가 "무엇을 확인하는지"가 묻히므로
 * 그럴듯한 기본값을 두고, 테스트는 신경 쓰는 필드만 덮어쓴다.
 * 한글 값은 목데이터와 마찬가지로 임의로 지은 것이다.
 */

export const PET_TYPE_NAME = "정겹게 달려가는 페스티벌맨";

export function makeStop(overrides: Partial<CourseStop> = {}): CourseStop {
  return {
    placeId: "place-1",
    name: "한밭수목원",
    category: "산책",
    district: "서구",
    condition: "전 견종 · 목줄 필수",
    petFriendly: true,
    ...overrides,
  };
}

export function makePost(overrides: Partial<FeedPost> = {}): FeedPost {
  return {
    id: "post-1",
    authorName: "콩이네",
    authorEmoji: "🐶",
    petTypeName: PET_TYPE_NAME,
    isMine: false,
    sameTypeMatch: false,
    caption: "서구 산책 코스",
    text: "넓어서 계속 뛰어놀았어요",
    stops: [{ ...makeStop(), dayIndex: 0 }],
    tags: ["당일치기", "서구"],
    likes: 0,
    liked: false,
    saves: 0,
    saved: false,
    createdAt: "2026-08-12T09:00:00.000Z",
    ...overrides,
  };
}

/** 서버 응답 모양의 게시물 — sameTypeMatch는 화면이 붙이는 값이라 빠져 있다. */
export function makeApiPost(overrides: Partial<ApiFeedPost> = {}): ApiFeedPost {
  const { sameTypeMatch: _sameTypeMatch, ...post } = makePost();
  return { ...post, ...overrides };
}

export function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: "article-1",
    date: "2026-08-12",
    title: "반려견과 걷기 좋은 대전 산책로",
    summary: "그늘이 많은 산책로를 모았어요",
    body: "본문입니다",
    likes: 5,
    liked: false,
    views: 1234,
    ...overrides,
  };
}

export function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: "course-1",
    label: "주말 산책 코스",
    emoji: null,
    nights: 0,
    transport: "자차",
    source: "manual",
    shared: false,
    days: [[makeStop()]],
    ...overrides,
  };
}

export function makeSchedule(overrides: Partial<CourseSchedule> = {}): CourseSchedule {
  return {
    id: "schedule-1",
    courseId: "course-1",
    date: "2026-08-01",
    festivalTitles: [],
    ...overrides,
  };
}

export function makeMbtiResult(overrides: Partial<MbtiResult> = {}): MbtiResult {
  return {
    code: "ENFP",
    name: "호기심 탐험가",
    theme: "산책",
    traits: ["활발함", "사람 좋아함"],
    ...overrides,
  };
}

export function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: "pet-1",
    name: "콩이",
    breed: "말티즈",
    weightKg: 3,
    ageYears: 4,
    size: "소형견",
    emoji: "🐶",
    ...overrides,
  };
}

export function makePlace(overrides: Partial<Place> = {}): Place {
  return {
    id: "place-1",
    name: "한밭수목원",
    category: "산책",
    district: "서구",
    condition: "전 견종",
    petFriendly: true,
    lat: 36.3669,
    lng: 127.3886,
    ...overrides,
  };
}

export function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: "review-1",
    placeId: "place-1",
    placeName: "한밭수목원",
    authorId: "user-1",
    authorName: "콩이네",
    isMine: true,
    text: "그늘이 많아요",
    tags: [{ code: "LEASH_REQUIRED", label: "목줄 필수", category: "PET_CONDITION" }],
    likes: 0,
    liked: false,
    createdAtLabel: "2일 전",
    ...overrides,
  };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: null,
    nickname: "콩이 보호자",
    provider: "local",
    ...overrides,
  };
}

export function makeBadge(overrides: Partial<Badge> = {}): Badge {
  return {
    id: "traveler",
    emoji: "🧳",
    name: "여행러 Lv.1",
    category: "단계형",
    rarity: 1,
    description: "다녀온 일정",
    earned: "코스에 날짜를 붙여 1번 다녀왔어요",
    how: "코스에 날짜를 붙여 다녀오면 쌓여요",
    got: false,
    level: 0,
    maxLevel: 1,
    current: 0,
    target: 1,
    hidden: false,
    tileLabel: "0/1",
    ...overrides,
  };
}

export function makeBadgeInput(overrides: Partial<BadgeInput> = {}): BadgeInput {
  return {
    isLoggedIn: false,
    pets: [],
    activePet: null,
    courses: [],
    schedules: [],
    reviews: [],
    posts: [],
    places: [],
    articleLikeCount: 0,
    today: "2026-09-14",
    ...overrides,
  };
}
