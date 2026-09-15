import { describe, expect, it } from "vitest";
import { ro } from "./josa";

describe("ro", () => {
  it("받침이 없으면 '로'", () => {
    expect(ro("콩이")).toBe("로");
    expect(ro("보리")).toBe("로");
  });

  it("ㄹ 받침은 받침이 있어도 '로'", () => {
    expect(ro("밤톨")).toBe("로");
    expect(ro("방울")).toBe("로");
  });

  it("그 밖의 받침은 '으로'", () => {
    expect(ro("댕댕")).toBe("으로");
    expect(ro("초코칩")).toBe("으로");
  });

  it("한글이 아니거나 빈 이름은 '로'로 둔다", () => {
    expect(ro("Coco")).toBe("로");
    expect(ro("")).toBe("로");
  });
});
