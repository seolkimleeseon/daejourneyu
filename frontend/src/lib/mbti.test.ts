import { describe, expect, it } from "vitest";
import {
  MBTI_QUESTIONS,
  MBTI_TYPES,
  resolveMbtiType,
  scoreAnswers,
  topTheme,
  type MbtiAnswer,
} from "@/lib/mbti";

const AXES = ["EI", "SN", "TF", "JP"] as const;

describe("문항 사전", () => {
  it("네 축을 고르게 묻는다 — 한 축만 많으면 결과가 그쪽으로 쏠린다", () => {
    const perAxis = AXES.map((axis) => MBTI_QUESTIONS.filter((q) => q.axis === axis).length);

    expect(new Set(perAxis).size).toBe(1);
    expect(perAxis[0]).toBeGreaterThan(0);
  });

  it("각 문항의 두 선택지는 자기 축의 서로 다른 글자를 가리킨다", () => {
    MBTI_QUESTIONS.forEach((question) => {
      expect(question.optionA.letter).not.toBe(question.optionB.letter);
      expect(question.axis).toContain(question.optionA.letter);
      expect(question.axis).toContain(question.optionB.letter);
    });
  });

  it("모든 문항에 문구가 채워져 있다", () => {
    MBTI_QUESTIONS.forEach((question) => {
      expect(question.question).toBeTruthy();
      expect(question.optionA.label).toBeTruthy();
      expect(question.optionB.label).toBeTruthy();
    });
  });
});

describe("유형 사전", () => {
  it("16가지 유형이 모두 있다", () => {
    expect(Object.keys(MBTI_TYPES)).toHaveLength(16);
  });

  it("각 유형의 code는 키와 같다", () => {
    Object.entries(MBTI_TYPES).forEach(([code, info]) => expect(info.code).toBe(code));
  });

  it("테마 배분은 세 항목 합이 100이다", () => {
    Object.values(MBTI_TYPES).forEach((info) => {
      const sum = info.theme.산책 + info.theme.맛집 + info.theme.문화;
      expect(sum).toBe(100);
    });
  });

  it("이름·설명·성향 태그가 비어 있지 않다", () => {
    Object.values(MBTI_TYPES).forEach((info) => {
      expect(info.name).toBeTruthy();
      expect(info.desc).toBeTruthy();
      expect(info.traits.length).toBeGreaterThan(0);
    });
  });
});

describe("scoreAnswers", () => {
  it("많이 고른 쪽 글자를 축마다 하나씩 뽑는다", () => {
    const answers: MbtiAnswer[] = ["E", "E", "N", "N", "T", "T", "J", "J"];

    expect(scoreAnswers(answers)).toBe("ENTJ");
  });

  it("동점이면 축별 기본값으로 정한다 — 결과가 비어버리면 안 된다", () => {
    const answers: MbtiAnswer[] = ["E", "I", "S", "N", "T", "F", "J", "P"];

    expect(scoreAnswers(answers)).toBe("ISFP");
  });

  it("아무것도 안 골라도 기본값 4글자를 만든다", () => {
    expect(scoreAnswers([])).toBe("ISFP");
  });

  it("'모르겠어요'(NEUTRAL)와 미응답(null)은 점수에 넣지 않는다", () => {
    const answers: MbtiAnswer[] = ["E", "NEUTRAL", null, "N", "T", "J"];

    // E·N·T·J만 1점씩 — 나머지 축은 0-0 동점이 아니라 각각 1-0이라 그대로 뽑힌다.
    expect(scoreAnswers(answers)).toBe("ENTJ");
  });

  it("한 축만 답해도 나머지는 기본값으로 채운다", () => {
    expect(scoreAnswers(["E"])).toBe("ESFP");
  });

  it("항상 사전에 있는 유형을 만든다", () => {
    const answers: MbtiAnswer[] = ["I", "I", "N", "S", "F", "F", "P", "J"];

    expect(MBTI_TYPES[scoreAnswers(answers)]).toBeTruthy();
  });
});

describe("resolveMbtiType", () => {
  it("코드로 유형을 찾는다", () => {
    expect(resolveMbtiType("ENFP").name).toBeTruthy();
    expect(resolveMbtiType("ENFP").code).toBe("ENFP");
  });

  it("모르는 코드는 기본 유형으로 대체한다 — 결과 화면이 비면 안 된다", () => {
    expect(resolveMbtiType("XXXX").code).toBe("ISFJ");
    expect(resolveMbtiType("").code).toBe("ISFJ");
  });
});

describe("topTheme", () => {
  it("배분이 가장 높은 테마를 고른다", () => {
    expect(topTheme(resolveMbtiType("ESFP"))).toBe("맛집");
    expect(topTheme(resolveMbtiType("ISTJ"))).toBe("산책");
    expect(topTheme(resolveMbtiType("ENTP"))).toBe("문화");
  });

  it("모든 유형이 추천 테마 3종 중 하나로 떨어진다 — 놀이터는 추천 테마가 아니다", () => {
    Object.values(MBTI_TYPES).forEach((info) => {
      expect(["산책", "맛집", "문화"]).toContain(topTheme(info));
    });
  });
});
