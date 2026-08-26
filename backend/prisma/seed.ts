/**
 * 로컬 개발 DB 시드. `npm run db:seed`로 실행한다.
 * 프론트 목데이터(frontend/src/mocks/courses.ts)를 정본으로 삼아 구조를 맞추고,
 * 캘린더·보관함 화면을 다양한 케이스로 볼 수 있도록 종류를 늘렸다.
 * ⚠ 한글 카피는 프론트 CLAUDE.md와 마찬가지로 잠정 데이터로 취급한다.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  nights: number;
  transport: "자차" | "대중교통";
  source: "ai" | "manual" | "saved";
  shared: boolean;
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
    nights: 0,
    transport: "자차",
    source: "manual",
    shared: true,
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
    nights: 1,
    transport: "대중교통",
    source: "ai",
    shared: false,
    days: [
      [stop("place-2", "계족산 황톳길", "산책", "대덕구", "전 견종 · 배변봉투 지참")],
      [stop("place-3", "대청호 오백리길", "산책", "동구", "전 견종 · 목줄 필수")],
    ],
  },
  {
    id: "course-3",
    label: "대흥동 감성 카페 투어",
    nights: 0,
    transport: "대중교통",
    source: "manual",
    shared: false,
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
    nights: 0,
    transport: "자차",
    source: "manual",
    shared: true,
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
    nights: 1,
    transport: "자차",
    source: "ai",
    shared: false,
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
    nights: 2,
    transport: "자차",
    source: "manual",
    shared: false,
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
    nights: 0,
    transport: "대중교통",
    source: "saved",
    shared: false,
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
    nights: 1,
    transport: "자차",
    source: "saved",
    shared: true,
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
];

async function main() {
  await prisma.user.upsert({
    where: { id: "user-1" },
    update: {},
    create: { id: "user-1", email: "kong.owner@example.com", nickname: "콩이맘" },
  });

  for (const course of courses) {
    await prisma.course.upsert({
      where: { id: course.id },
      update: {},
      create: {
        id: course.id,
        label: course.label,
        nights: course.nights,
        transport: course.transport,
        source: course.source,
        shared: course.shared,
        userId: "user-1",
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
              schedule: {
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

  console.log(`✅ 시드 완료: 사용자 1명, 코스 ${courses.length}개`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
