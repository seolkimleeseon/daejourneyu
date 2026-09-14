# CLAUDE.md — backend

`backend/` 작업 시 루트 `CLAUDE.md`(도메인 용어·Git 정책·공통 컨벤션)에 더해 적용되는 규칙.
프론트와의 데이터 모델 불일치는 루트 CLAUDE.md "현재 연동 상태"를 먼저 확인할 것.

## 현재 상태

Express API 서버의 **스캐폴딩 단계**다. 실제로 존재하는 건 헬스체크와 `/api/places` 하나뿐이고,
데이터는 `routes/places.ts` 안의 하드코딩 배열이다. DB·인증·린터 모두 아직 없다.

```
src/
├─ index.ts        서버 진입점 (CORS·미들웨어·라우트 등록)
└─ routes/         도메인별 라우터. 파일 하나 = 도메인 하나
   └─ places.ts
```

## 명령어

```bash
npm run dev      # tsx watch src/index.ts — http://localhost:4000
npm run build    # tsc → dist/ (타입 체크 겸용)
npm start        # node dist/index.js
npm test         # vitest run (1회 실행)
npm run test:watch  # vitest 감시 모드
```

**변경 후 `npm test`와 `npm run build`를 둘 다 통과시킨다.** 테스트는 Vitest
(`vitest.config.mts`, 환경 `node`)로 대상 파일 옆 `src/**/*.test.ts`에 두며, `tsconfig.json`에서
제외되어 `dist/`에는 빌드되지 않는다(테스트 파일 자체의 타입은 `tsc`가 검사하지 않는다).
라우트 테스트는 supertest로 라우터를 작은 Express 앱에 붙여 호출하고, `../lib/prisma`와
`../lib/auth`는 `vi.mock`으로 바꿔 DB·`JWT_SECRET` 없이 돈다(`src/routes/posts.test.ts` 참고).
쿠키 `daejourneyu_token=valid:<userId>`를 보내면 그 사용자로 로그인한 것으로 취급한다.
Prisma를 mock하므로 **쿼리 인자가 맞는지까지만** 보장된다 — 실제 DB 동작(제약·트랜잭션)은
확인되지 않으니, 테스트가 없는 라우트는 물론 스키마를 건드린 변경도 `curl`로 실제 응답까지 확인한다.

## 규약

- **모든 엔드포인트는 `/api` 프리픽스 아래.** 프론트의 `next.config.mjs` rewrites가 `/api/*`만
  이 서버로 프록시하므로, 프리픽스를 벗어난 경로는 프론트에서 도달할 수 없다.
- 라우터는 `express.Router()`를 만들어 **default export**하고, `index.ts`에서
  `app.use("/api/<도메인>", router)`로 마운트한다(`routes/places.ts` 패턴 그대로).
  라우터 내부 경로는 `/`, `/:id`처럼 마운트 지점 기준 상대 경로로 쓴다.
- 목록 조회의 필터는 **쿼리스트링**으로 받는다 (`GET /api/places?gu=서구&cat=산책`).
- 에러 응답은 `res.status(<코드>).json({ error: "<메시지>" })` 형태로 통일한다.
  없는 리소스는 404, 잘못된 입력은 400.
- TypeScript `strict`, `module: commonjs`, `target: ES2020`. `any` 금지 — `unknown` 또는 명시적 타입.
- 응답 타입(위 `Place`처럼)은 라우터 파일 안에서 `type`으로 선언한다. 여러 라우터가 공유하게 되면
  그때 `src/types/`로 승격시킨다 — 미리 만들지 않는다.
- 주석은 한국어.

## 주의사항

- **CORS origin이 `http://localhost:3000`으로 하드코딩되어 있다**(`index.ts`). 배포 시 반드시
  환경변수로 빼야 하며, 그 전까지 다른 포트·도메인에서 오는 요청은 전부 차단된다.
- **`dotenv`가 설치되어 있지 않다.** 현재 `process.env`를 읽는 곳은 `PORT` 한 군데뿐이고 `.env`
  파일도 없다. 환경변수를 본격적으로 쓰려면 `dotenv` 추가부터 필요하다.
- 에러 핸들링 미들웨어와 요청 검증이 없다. 핸들러에서 예외가 나면 Express 기본 처리로 떨어지고
  스택 트레이스가 노출될 수 있다. 라우트를 늘리기 전에 공통 에러 핸들러를 먼저 두는 편이 좋다.
- 린터가 없다(`npm run lint` 스크립트도 없음). 프론트는 `next lint`가 있어 비대칭 상태다.

## 아직 결정되지 않은 것

아래는 README의 **권장 사항일 뿐 확정된 결정이 아니다.** 이 방향으로 코드를 작성하기 전에
반드시 팀에 확인할 것.

- DB: Prisma + SQLite(로컬)로 결정됨 — `Course`에 이어 `Place`도 이 방식으로 영속화됨(최종 방향인
  PostgreSQL/Supabase 전환은 `prisma/schema.prisma` 상단 주석 참고)
- 인증: NextAuth.js(카카오 로그인)와의 역할 분담
- 배포: 백엔드 Railway/Render, DB Supabase
