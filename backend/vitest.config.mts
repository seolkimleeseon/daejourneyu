import { defineConfig } from "vitest/config";

// 백엔드 단위 테스트 설정.
// 테스트는 대상 파일 옆에 `*.test.ts`로 두고, tsconfig에서 제외해 dist/에는 빌드되지 않게 한다.
// 이 패키지는 commonjs라 설정 파일은 ESM으로 확실히 읽히도록 .mts 확장자를 쓴다.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
