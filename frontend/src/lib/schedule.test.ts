import { describe, expect, it } from "vitest";
import { findActiveTrip } from "@/lib/schedule";
import { makeCourse, makeSchedule, makeStop } from "@/test/fixtures";

const TODAY = "2026-09-14";

const dayTrip = makeCourse({ id: "course-1", label: "유성 당일 코스", nights: 0 });
const twoNights = makeCourse({ id: "course-2", label: "대전 2박 코스", nights: 2 });

function scheduleOn(date: string, courseId = "course-1", id = `s-${date}`) {
  return makeSchedule({ id, courseId, date });
}

describe("findActiveTrip", () => {
  it("일정이 없으면 null", () => {
    expect(findActiveTrip([], [dayTrip], TODAY)).toBeNull();
  });

  it("오늘 출발이면 이미 여행 중으로 본다", () => {
    const trip = findActiveTrip([scheduleOn(TODAY)], [dayTrip], TODAY);

    // 주의: 코드에 있는 "오늘 여행!" 라벨은 지금 도달할 수 없다 — dday가 0이면 ongoing도 항상
    // true라 앞 분기에서 "여행 중"으로 끝난다. 소유자 확인 전까지 현재 동작만 적어둔다.
    expect(trip).toMatchObject({ ddayLabel: "여행 중", courseLabel: "유성 당일 코스" });
  });

  it("앞으로 올 일정은 남은 날짜로 센다", () => {
    expect(findActiveTrip([scheduleOn("2026-09-17")], [dayTrip], TODAY)?.ddayLabel).toBe("D-3");
  });

  it("기본 7일을 넘겨 잡힌 일정은 아직 보여주지 않는다", () => {
    expect(findActiveTrip([scheduleOn("2026-09-22")], [dayTrip], TODAY)).toBeNull();
  });

  it("기간을 넓히면 더 먼 일정도 잡는다", () => {
    expect(findActiveTrip([scheduleOn("2026-09-22")], [dayTrip], TODAY, 30)?.ddayLabel).toBe("D-8");
  });

  it("다일 코스는 시작일이 지나도 마지막 밤까지 '여행 중'", () => {
    // 9/12 출발 2박 → 9/12·13·14가 여행 기간.
    const trip = findActiveTrip([scheduleOn("2026-09-12", "course-2")], [twoNights], TODAY);

    expect(trip).toMatchObject({ ddayLabel: "여행 중", ongoing: true });
  });

  it("마지막 밤을 넘기면 지난 일정으로 본다", () => {
    // 9/11 출발 2박 → 9/13에 끝난다.
    expect(findActiveTrip([scheduleOn("2026-09-11", "course-2")], [twoNights], TODAY)).toBeNull();
  });

  it("당일치기는 하루만 지나도 지난 일정이다", () => {
    expect(findActiveTrip([scheduleOn("2026-09-13")], [dayTrip], TODAY)).toBeNull();
  });

  it("여행 중인 일정이 더 가까운 예정보다 먼저다", () => {
    const trip = findActiveTrip(
      [scheduleOn(TODAY, "course-1", "s-today"), scheduleOn("2026-09-12", "course-2", "s-ongoing")],
      [dayTrip, twoNights],
      TODAY
    );

    expect(trip).toMatchObject({ ongoing: true, courseLabel: "대전 2박 코스" });
  });

  it("예정만 여럿이면 가장 가까운 것을 고른다", () => {
    const trip = findActiveTrip(
      [scheduleOn("2026-09-18", "course-2", "s-far"), scheduleOn("2026-09-16", "course-1", "s-near")],
      [dayTrip, twoNights],
      TODAY
    );

    expect(trip?.courseLabel).toBe("유성 당일 코스");
  });

  it("코스가 지워진 일정은 건너뛴다", () => {
    const orphan = scheduleOn(TODAY, "course-사라짐");

    expect(findActiveTrip([orphan], [dayTrip], TODAY)).toBeNull();
  });

  it("혼잡도 티커용으로 모든 일차의 장소를 한 줄로 모은다", () => {
    const course = makeCourse({
      id: "course-3",
      nights: 1,
      days: [
        [makeStop({ placeId: "a", name: "한밭수목원" })],
        [makeStop({ placeId: "b", name: "장태산" })],
      ],
    });

    const trip = findActiveTrip([scheduleOn(TODAY, "course-3")], [course], TODAY);

    expect(trip?.stops.map((stop) => stop.placeId)).toEqual(["a", "b"]);
  });

  it("여러 날에 같은 장소가 들어 있어도 한 번만 센다", () => {
    const course = makeCourse({
      id: "course-4",
      nights: 1,
      days: [
        [makeStop({ placeId: "a" }), makeStop({ placeId: "b" })],
        [makeStop({ placeId: "a" })],
      ],
    });

    const trip = findActiveTrip([scheduleOn(TODAY, "course-4")], [course], TODAY);

    expect(trip?.stops.map((stop) => stop.placeId)).toEqual(["a", "b"]);
  });
});
