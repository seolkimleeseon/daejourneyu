import { describe, expect, it } from "vitest";
import type { Course, CourseStop } from "@/types";
import {
  BADGE_CATEGORIES,
  computeMyBadges,
  groupBadgesByCategory,
  nearBadgeMessage,
  pickNearestBadge,
  remainingSteps,
  todayString,
  type Badge,
  type BadgeId,
  type BadgeInput,
} from "@/lib/badges";
import {
  makeBadge,
  makeBadgeInput,
  makeCourse,
  makePet,
  makePlace,
  makePost,
  makeReview,
  makeSchedule,
  makeStop,
} from "@/test/fixtures";

function badgeById(badges: Badge[], id: BadgeId): Badge {
  const badge = badges.find((item) => item.id === id);
  if (!badge) throw new Error(`뱃지 ${id}가 없어요`);
  return badge;
}

/** 코스 하나를 과거 날짜 일정으로 다녀온 상태를 만든다. */
function visited(
  days: CourseStop[][],
  options: { course?: Partial<Course>; date?: string; festivalTitles?: string[] } = {}
): Pick<BadgeInput, "courses" | "schedules"> {
  const course = makeCourse({ id: "visited-course", days, ...options.course });
  return {
    courses: [course],
    schedules: [
      makeSchedule({
        courseId: course.id,
        date: options.date ?? "2026-08-01",
        festivalTitles: options.festivalTitles ?? [],
      }),
    ],
  };
}

function compute(overrides: Partial<BadgeInput> = {}): Badge[] {
  return computeMyBadges(makeBadgeInput(overrides));
}

const stopIn = (district: CourseStop["district"], extra: Partial<CourseStop> = {}) =>
  makeStop({ placeId: `place-${district}`, district, ...extra });

describe("computeMyBadges — 카탈로그", () => {
  it("44종이 계열 순서대로 겹치는 id 없이 나온다", () => {
    const badges = compute();
    expect(badges).toHaveLength(44);
    expect(new Set(badges.map((badge) => badge.id)).size).toBe(44);
    expect(badges.every((badge) => BADGE_CATEGORIES.includes(badge.category))).toBe(true);
  });

  it("모든 뱃지가 받은 뒤 설명을 문장으로 갖는다", () => {
    // 타일 라벨(description)은 "하루에 3개 구"처럼 줄여 쓴 말이라 그것만으로는 무엇을 해서
    // 받았는지 읽히지 않는다. 목록·상세에 나가는 earned는 반드시 문장이어야 한다.
    for (const badge of compute()) {
      expect(badge.earned.length, badge.id).toBeGreaterThan(badge.description.length);
      expect(badge.earned.endsWith("요"), badge.id).toBe(true);
    }
  });

  it("아무것도 안 했으면 로그인 뱃지 외에는 하나도 없다", () => {
    expect(compute().filter((badge) => badge.got)).toEqual([]);
    expect(compute({ isLoggedIn: true }).filter((badge) => badge.got).map((b) => b.id)).toEqual([
      "first-owner",
    ]);
  });
});

describe("computeMyBadges — 다녀온 일정 판정", () => {
  it("오늘까지의 일정만 다녀온 것으로 치고, 미래 일정은 세지 않는다", () => {
    const course = makeCourse({ id: "c1" });
    const badges = compute({
      courses: [course],
      schedules: [
        makeSchedule({ id: "s1", courseId: "c1", date: "2026-09-14" }),
        makeSchedule({ id: "s2", courseId: "c1", date: "2026-09-15" }),
      ],
    });
    expect(badgeById(badges, "traveler").current).toBe(1);
    // '첫 여정'은 다녀왔는지가 아니라 일정을 등록했는지를 본다.
    expect(badgeById(badges, "first-journey").got).toBe(true);
  });

  it("지워진 코스의 일정은 다녀온 것으로 치지 않는다", () => {
    const badges = compute({ schedules: [makeSchedule({ courseId: "ghost" })] });
    expect(badgeById(badges, "traveler").current).toBe(0);
  });
});

describe("computeMyBadges — 단계형", () => {
  it("아직 Lv.1도 못 땄으면 Lv.1 이름에 진행도 라벨을 단다", () => {
    const badge = badgeById(compute(), "review-king");
    expect(badge).toMatchObject({
      name: "후기왕 Lv.1",
      got: false,
      level: 0,
      maxLevel: 3,
      current: 0,
      target: 1,
      tileLabel: "0/1",
    });
  });

  it("단계를 넘기면 이름에 레벨이 붙고 다음 단계가 목표가 된다(남의 후기는 세지 않음)", () => {
    const reviews = [
      ...Array.from({ length: 10 }, (_, i) => makeReview({ id: `mine-${i}`, isMine: true })),
      makeReview({ id: "other", isMine: false }),
    ];
    expect(badgeById(compute({ reviews }), "review-king")).toMatchObject({
      name: "후기왕 Lv.2",
      got: true,
      level: 2,
      current: 10,
      target: 30,
      tileLabel: "Lv.2",
    });
  });

  it("단계형 설명은 임계값이 아니라 실제로 쌓은 개수를 말한다", () => {
    // 만렙(30)을 넘겨 45개를 쓴 상태 — 진행도 바도 다음 단계 안내도 사라지는 자리라
    // 설명이 "후기 수예요"로 끝나면 가리킬 숫자가 화면에 없다.
    const reviews = Array.from({ length: 45 }, (_, i) => makeReview({ id: `r${i}`, isMine: true }));
    const badge = badgeById(compute({ reviews }), "review-king");
    expect(badge.earned).toBe("다녀온 장소에 후기를 45개 남겼어요");
    expect(badge.current).toBe(30);
  });

  it("만렙이면 마지막 임계값을 목표로 두고 남은 걸음은 0이다", () => {
    const reviews = Array.from({ length: 35 }, (_, i) => makeReview({ id: `r-${i}` }));
    const badge = badgeById(compute({ reviews }), "review-king");
    expect(badge).toMatchObject({ level: 3, current: 30, target: 30, tileLabel: "Lv.3" });
    expect(remainingSteps(badge)).toBe(0);
  });

  it("사진 붙인 후기·받은 좋아요·누른 좋아요를 각자 센다", () => {
    const badges = compute({
      reviews: [makeReview({ photoUrl: "data:image/png;base64,AAA" }), makeReview({ id: "r2" })],
      posts: [
        makePost({ id: "mine-1", isMine: true, likes: 6 }),
        makePost({ id: "mine-2", isMine: true, likes: 4 }),
        ...Array.from({ length: 10 }, (_, i) =>
          makePost({ id: `other-${i}`, isMine: false, liked: true })
        ),
      ],
    });
    expect(badgeById(badges, "photographer").current).toBe(1);
    expect(badgeById(badges, "popular-course").got).toBe(true);
    expect(badgeById(badges, "neighbor-love").got).toBe(true);
  });

  it("직접 만든 코스와 보관한 코스를 출처로 가른다", () => {
    const badges = compute({
      courses: [
        makeCourse({ id: "m1", source: "manual" }),
        ...["s1", "s2", "s3"].map((id) => makeCourse({ id, source: "saved" })),
      ],
    });
    expect(badgeById(badges, "course-maker").current).toBe(1);
    expect(badgeById(badges, "collector").got).toBe(true);
  });
});

describe("computeMyBadges — 발도장", () => {
  it("5개 구를 모두 밟으면 대전 한바퀴, 못 밟았으면 진행도를 보여준다", () => {
    const all = compute(
      visited([[stopIn("유성구"), stopIn("중구"), stopIn("동구")], [stopIn("대덕구"), stopIn("서구")]])
    );
    expect(badgeById(all, "dj-full-round")).toMatchObject({ got: true, tileLabel: "5개 구 완주" });

    const four = compute(visited([[stopIn("유성구"), stopIn("동구"), stopIn("대덕구"), stopIn("서구")]]));
    expect(badgeById(four, "dj-full-round")).toMatchObject({ got: false, tileLabel: "4/5" });
  });

  it("하루에 서로 다른 구 셋을 담아 다녀오면 하루 원정대", () => {
    const badges = compute(visited([[stopIn("유성구"), stopIn("중구"), stopIn("동구")]]));
    expect(badgeById(badges, "one-day-expedition").got).toBe(true);
  });

  it("명소는 이름이 아니라 등록된 장소 id로 판정한다", () => {
    const byId = compute(visited([[makeStop({ placeId: "place-2", name: "아무 이름" })]]));
    expect(badgeById(byId, "landmark-gyejoksan").got).toBe(true);

    const byName = compute(visited([[makeStop({ placeId: "unknown", name: "계족산 황톳길" })]]));
    expect(badgeById(byName, "landmark-gyejoksan").got).toBe(false);
  });

  it("같은 구를 두 번씩 5개 구 모두 가면 골고루 여행자", () => {
    const twice = (["유성구", "중구", "동구", "대덕구", "서구"] as const).flatMap((district) => [
      stopIn(district),
      stopIn(district),
    ]);
    expect(badgeById(compute(visited([twice])), "even-traveler").got).toBe(true);
  });
});

describe("computeMyBadges — 여행법", () => {
  it("1박 이상·하루 5곳·하루 2곳 이하 코스를 각각 알아본다", () => {
    const packed = Array.from({ length: 5 }, (_, i) => makeStop({ placeId: `p${i}` }));
    const badges = compute(visited([packed, [makeStop()]], { course: { nights: 1 } }));
    expect(badgeById(badges, "one-more-night").got).toBe(true);
    expect(badgeById(badges, "packed-day").got).toBe(true);
    expect(badgeById(badges, "slow-day").got).toBe(true);
  });

  it("이동수단별로 다녀온 횟수를 센다", () => {
    const badges = compute(visited([[makeStop()]], { course: { transport: "대중교통" } }));
    expect(badgeById(badges, "walker").current).toBe(1);
    expect(badgeById(badges, "car-lover").current).toBe(0);
  });
});

describe("computeMyBadges — 취향", () => {
  it("소형견 전용 장소와 제한 없는 장소를 Place의 smallDogOnly로 가르고, 같은 곳은 한 번만 센다", () => {
    const small = ["s1", "s2", "s3"];
    const open = ["o1", "o2", "o3", "o4", "o5"];
    const stops = [...small, ...open, "s1"].map((placeId) => makeStop({ placeId }));
    const places = [
      ...small.map((id) => makePlace({ id, smallDogOnly: true })),
      ...open.map((id) => makePlace({ id })),
    ];

    const badges = compute({ ...visited([stops]), places });
    expect(badgeById(badges, "careful-owner")).toMatchObject({ got: true, current: 3 });
    expect(badgeById(badges, "all-breeds")).toMatchObject({ got: true, current: 5 });
  });

  it("장소 정보가 없는 지점은 전 견종 환영으로 세지 않는다", () => {
    const badges = compute(visited([[makeStop({ placeId: "no-place" })]]));
    expect(badgeById(badges, "all-breeds").current).toBe(0);
  });

  it("네 카테고리를 모두 다녀오면 편식 없는 여행자", () => {
    const stops = (["산책", "놀이터", "맛집", "문화"] as const).map((category) =>
      makeStop({ placeId: category, category })
    );
    expect(badgeById(compute(visited([stops])), "no-picky").got).toBe(true);
  });
});

describe("computeMyBadges — 반려동물", () => {
  const mbti = { code: "ENFP", name: "정겹게 달려가는 페스티벌맨", theme: "산책" as const, traits: [] };

  it("프로필이 다 채워져야 프로필 완성", () => {
    expect(badgeById(compute({ activePet: makePet() }), "pet-profile").got).toBe(true);
    expect(badgeById(compute({ activePet: makePet({ weightKg: 0 }) }), "pet-profile").got).toBe(false);
  });

  it("MBTI 진단과, 추천 테마 장소를 다녀왔는지를 본다", () => {
    const pet = makePet({ mbti });
    const badges = compute({ activePet: pet, pets: [pet], ...visited([[makeStop({ category: "산책" })]]) });
    expect(badgeById(badges, "pet-mbti").got).toBe(true);
    expect(badgeById(badges, "by-type").got).toBe(true);
    expect(badgeById(badges, "mbti-explorer").current).toBe(1);
  });

  it("반려동물을 두 마리 이상 등록하면 멍친구", () => {
    const pets = [makePet({ id: "a" }), makePet({ id: "b" })];
    expect(badgeById(compute({ pets }), "dog-friend").got).toBe(true);
  });
});

describe("computeMyBadges — 한정", () => {
  it("4월에 산책 장소를 다녀오면 봄 벚꽃, 1월이면 겨울 산책러", () => {
    expect(
      badgeById(compute(visited([[makeStop({ category: "산책" })]], { date: "2026-04-10" })), "spring-blossom").got
    ).toBe(true);
    expect(
      badgeById(compute(visited([[makeStop({ category: "산책" })]], { date: "2026-01-05" })), "winter-walk").got
    ).toBe(true);
  });

  it("9~11월에 대덕구를 다녀오면 가을 계족산", () => {
    const badges = compute(visited([[stopIn("대덕구")]], { date: "2025-10-03" }));
    expect(badgeById(badges, "autumn-gyejoksan").got).toBe(true);
  });

  it("0시축제 일정은 중구 장소가 있어야 인정한다", () => {
    const withJunggu = compute(visited([[stopIn("중구")]], { festivalTitles: ["대전 0시 축제"] }));
    expect(badgeById(withJunggu, "festival-zero").got).toBe(true);

    const elsewhere = compute(visited([[stopIn("서구")]], { festivalTitles: ["대전 0시 축제"] }));
    expect(badgeById(elsewhere, "festival-zero").got).toBe(false);
  });

  it("오픈일이 정해지기 전에는 대저니유 생일을 아무도 못 딴다", () => {
    expect(badgeById(compute(), "service-birthday").got).toBe(false);
  });
});

describe("computeMyBadges — 히든", () => {
  it("히든 표시가 붙고, 조건을 채우면 딸 수 있다", () => {
    const hundred = Array.from({ length: 100 }, (_, i) => makeStop({ placeId: `p${i}` }));
    const badges = compute(visited([hundred]));
    expect(badgeById(badges, "hundred-stamps")).toMatchObject({ hidden: true, got: true });
    expect(badgeById(badges, "night-walker")).toMatchObject({ hidden: true, got: false });
  });
});

describe("groupBadgesByCategory", () => {
  it("계열 순서대로 묶고 계열별 획득 수를 센다", () => {
    const groups = groupBadgesByCategory(compute({ isLoggedIn: true }));
    expect(groups.map((group) => group.category)).toEqual(BADGE_CATEGORIES);
    expect(groups.find((group) => group.category === "시작")?.gotCount).toBe(1);
  });

  it("뱃지가 없는 계열은 빼고, 계열 안의 순서는 건드리지 않는다", () => {
    const badges = [
      makeBadge({ id: "walker", category: "여행법" }),
      makeBadge({ id: "car-lover", category: "여행법", got: true }),
    ];
    expect(groupBadgesByCategory(badges)).toEqual([
      { category: "여행법", badges, gotCount: 1 },
    ]);
  });
});

describe("remainingSteps", () => {
  it("목표까지 남은 개수를 돌려주고, 만렙이면 0이다", () => {
    expect(remainingSteps(makeBadge({ level: 0, maxLevel: 1, current: 3, target: 5 }))).toBe(2);
    expect(remainingSteps(makeBadge({ level: 1, maxLevel: 1, current: 5, target: 5 }))).toBe(0);
  });
});

describe("pickNearestBadge", () => {
  const near = (overrides: Partial<Badge>) =>
    makeBadge({ level: 0, maxLevel: 1, current: 4, target: 5, ...overrides });

  it("히든·시작 안 한 것·만렙·두 걸음보다 먼 것은 고르지 않는다", () => {
    expect(
      pickNearestBadge([
        near({ id: "night-walker", hidden: true }),
        near({ id: "walker", current: 0 }),
        near({ id: "car-lover", level: 1, current: 5 }),
        near({ id: "gourmet", current: 2, target: 5 }),
      ])
    ).toBeNull();
  });

  it("남은 걸음이 적은 것을 먼저 고른다", () => {
    const picked = pickNearestBadge([
      near({ id: "walker", current: 3, target: 5 }),
      near({ id: "gourmet", current: 9, target: 10 }),
    ]);
    expect(picked?.id).toBe("gourmet");
  });

  it("남은 걸음이 같으면 더 귀한 것, 그것도 같으면 id 순으로 고정한다", () => {
    expect(
      pickNearestBadge([near({ id: "walker", rarity: 1 }), near({ id: "gourmet", rarity: 3 })])?.id
    ).toBe("gourmet");
    expect(
      pickNearestBadge([near({ id: "traveler", rarity: 2 }), near({ id: "collector", rarity: 2 })])?.id
    ).toBe("collector");
  });
});

describe("nearBadgeMessage", () => {
  it("대전 한바퀴는 남은 구가 한 곳이면 이름으로 부른다", () => {
    const input = makeBadgeInput(
      visited([[stopIn("유성구"), stopIn("동구"), stopIn("대덕구"), stopIn("서구")]])
    );
    const badge = badgeById(computeMyBadges(input), "dj-full-round");
    expect(nearBadgeMessage(badge, input)).toBe("중구만 가면 대전 한바퀴 완성");
  });

  it("대전 한바퀴는 남은 구가 두 곳이면 둘 다 부른다", () => {
    const input = makeBadgeInput(visited([[stopIn("유성구"), stopIn("동구"), stopIn("서구")]]));
    const badge = badgeById(computeMyBadges(input), "dj-full-round");
    expect(nearBadgeMessage(badge, input)).toBe("중구·대덕구 두 곳이면 대전 한바퀴 완성");
  });

  it("그 밖에는 남은 개수로 말한다", () => {
    const input = makeBadgeInput(visited([[stopIn("유성구"), stopIn("서구")]]));
    const badge = badgeById(computeMyBadges(input), "dj-full-round");
    expect(nearBadgeMessage(badge, input)).toBe("대전 한바퀴까지 3개 남았어요");

    const reviewKing = makeBadge({ id: "review-king", name: "후기왕 Lv.1", current: 9, target: 10 });
    expect(nearBadgeMessage(reviewKing, makeBadgeInput())).toBe("후기왕 Lv.1까지 1개 남았어요");
  });
});

describe("todayString", () => {
  it("로컬 날짜를 YYYY-MM-DD로 0을 채워 만든다", () => {
    expect(todayString(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
