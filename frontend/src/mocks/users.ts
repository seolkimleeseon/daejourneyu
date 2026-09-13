import type { User } from "@/types";

/** 실제 세션은 /api/auth로 대체됐다. 이 목데이터는 화면 미리보기 용도로만 남긴다. */
export const mockUser: User = {
  id: "user-1",
  email: "kong.owner@example.com",
  nickname: "콩이맘",
  provider: "local",
};
