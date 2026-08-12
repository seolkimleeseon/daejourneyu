# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code(claude.ai/code)에게 가이드를 제공한다.

## 프로젝트

Daejourneyu (대저니유) — 대전 반려동물 여행 PWA. 단일 HTML/JS 프로토타입
(`daejeoniyou_v260801_clean12.html`)을 제대로 된 Next.js 앱으로 재구축하는 중이다. **전체 화면
인벤토리, 아래 모든 구조적 결정의 근거, 그리고 프로토타입에서 의도적으로 포팅하지 않은 화면(레거시/중복
시스템)은 `PLAN.md`를 참고할 것.** 이 디렉터리는 프론트엔드 전용이며 아직 백엔드가 없다 — 모든 데이터는
`src/mocks` 아래 타입이 지정된 목데이터다.

## 명령어

```bash
npm run dev      # Next.js 개발 서버 실행 (개발 모드에서는 PWA 서비스워커 비활성화)
npm run build    # 프로덕션 빌드 (타입 체크도 함께 수행)
npm run start    # 프로덕션 빌드 실행
npm run lint     # next lint
```

아직 테스트 스위트는 구성되어 있지 않다.

## 기술 스택

Next.js 14 (App Router) + TypeScript + **Tailwind CSS v4** (`app/globals.css`의 `@theme`을 통한
CSS-first 설정 — `tailwind.config.ts` 파일은 없고, 필요하지도 않다) + TanStack Query + Zustand.
React Router는 사용하지 않는다(Next.js App Router가 모든 내비게이션을 처리).

## 아키텍처

- **라우팅**: `app/page.tsx`는 `/home`으로 리다이렉트한다. 하단 5개 탭은 `app/(shell)/` 라우트
  그룹 — `home/`, `map/`, `schedule/`, `feed/`, `my/` — 안에 있으며, 모두 `app/(shell)/layout.tsx`
  (`<AppShell>`, 즉 항상 유지되는 `<BottomNav>`를 마운트)를 공유한다. 여러 탭에서 진입 가능한
  하위 화면(예: 향후 `placeDetail`, `articleDetail`)은 어느 탭이 먼저 링크를 걸었든 그 아래에
  중첩시키지 말고 `(shell)` 밖의 최상위 라우트로 둔다 — 전체 제안 트리는 PLAN.md §2 참고.
- **전역 TopBar가 아닌 페이지별 TopBar**: 각 `page.tsx`는 JSX 최상단에서 자신의
  `<TopBar title=... />`를 직접 렌더링한다(`fixed`가 아니라 `sticky top-0`). `AppShell`은 하단
  내비게이션만 소유한다. 라우트마다 바뀌는 동적 타이틀을 공유 레이아웃까지 prop-drilling할 필요가
  없어진다.
- **스플래시 화면**: `src/components/shell/Providers.tsx`(루트 `app/layout.tsx`)에서 한 번만
  마운트된다. 탭별로 마운트하지 않는다 — 일반적인 탭 이동에서 다시 나타나면 안 되기 때문이다.
- **상태 분리**: 휘발성/클라이언트 UI 상태(인증 세션, 활성 반려동물, 토스트)는 `src/stores` 아래
  Zustand 스토어에 둔다. 언젠가 백엔드에서 내려올 데이터(후기, 장소, 코스 등)는 목 fetcher를 감싼
  `src/hooks`의 TanStack Query 훅을 통해 읽는다 — 따라할 패턴은 `src/hooks/useReviews.ts` 참고.
  교체 지점은 `// TODO(api)`로 표시한다.
- **목데이터**: `src/mocks/*.ts`, 도메인별로 파일을 나누고 `src/mocks/index.ts`에서 barrel
  export한다. 프로토타입의 하드코딩된 배열(`jyDB`, `jyCourses`, `reviews`, `jyPosts` 등)을
  포팅한 것이다. ⚠ 프로토타입 HTML은 한글 텍스트 상당 부분의 인코딩이 깨져 있었다 — 잘 알려진
  장소명은 확신을 갖고 복원했지만, 일부 카피는 바이트 단위로 정확히 옮긴 게 아니라 재구성한 것이다.
  목데이터 *내용*은 잠정적인 것으로 취급하고, *구조*(필드/유니언/관계)만 신뢰할 수 있는 부분으로
  본다.
- **디자인 토큰**: `app/globals.css`의 `@theme` 안에 한 번만 정의되며, PLAN.md §3–§4에 따라
  프로토타입의 `:root` 팔레트를 출처로 한다(`.jv` 스코프의 중복 팔레트도 아니고, 이 파일이 예전에
  갖고 있던 더 작은 토큰 세트도 아니다). 토큰명은 Tailwind 기본 키와 충돌하지 않도록 의도적으로
  지었다 — 색상은 `brand`, `accent-{purple,amber,coral,navy}`, `surface`, `card`,
  `line`/`line-strong`, `ink`/`ink-muted`, `steel-{100..700}`이며 `gray`/`text`/`border`를 단독
  키로 쓰지 않는다. radius는 `rounded-md|lg|xl|2xl`을 각각 8/12/16/22px로 재매핑했다. **컴포넌트
  안에서 raw hex를 절대 쓰지 말고 — 토큰을 추가하거나 재사용할 것.**
- **경로 별칭**: `@/*` → `./src/*` (저장소 루트가 아니다 — `app/` 자체는 상대 경로로 임포트하거나,
  라우트가 위치하는 곳으로만 쓰인다).

## 컨벤션

- UI 카피와 코드 주석은 프로토타입 및 나머지 코드베이스와 마찬가지로 한국어로 작성한다.
- 컴포넌트 하나당 파일 하나. 재사용 가능한 스타일 전용 primitive(`Button`, `Card`, `Tag`, `Modal`,
  `BottomSheet`, `Toast`)는 `src/components/ui`에 두고, 도메인에 특화된 것은
  `src/components/<domain>`(예: `src/components/my`) 또는 `src/components/shell`에 둔다.
- 인터랙티브 컴포넌트(`onClick`/훅이 있는 모든 것)는 명시적으로 `"use client"`로 표시한다. 이
  코드베이스에서는 라우트 `page.tsx` 파일이 거의 항상 로컬 UI 상태가 필요하므로 기본적으로 클라이언트
  컴포넌트로 둔다 — 서버 컴포넌트로 유지하려고 억지로 애쓰지 않는다.
- 다단계 플로우(코스 생성 위저드, MBTI 퀴즈)는 스텝마다 라우트를 나누지 않고 **라우트 하나 + 내부
  스텝 state**로 구성한다 — 이유는 PLAN.md §4-1 참고. 각 스텝은 `steps/` 폴더 아래 별도 파일로
  쪼개서 병렬 작업 시 하나의 거대한 컴포넌트에서 충돌하지 않게 한다.
- 여러 진입점에서 재사용되는 폼(예: 온보딩 *및* My 탭에서의 반려동물 등록)은 진입점마다 중복
  구현하지 말고, `mode` prop을 받는 공유 컴포넌트 하나로 만들고 각 페이지는 그걸 부르는 얇은
  래퍼로만 둔다(PLAN.md §4-2).
- 장소 선택 바텀시트는 플로우마다 복붙하지 않고 상태로 구동되는 제네릭 `<BottomSheet>` 인스턴스
  하나로 둔다 — 프로토타입에는 거의 동일한 구현이 두 벌(`jvOpenPicker` / `jvOpenSchedPicker`)
  있었는데, 이게 바로 피해야 할 중복이다.
- PLAN.md §1에서 레거시/오펀으로 표시한 프로토타입 화면(`manualCourseDays`/`placeBrowse`/
  `placeSearch`/`myCourseResult`, `savedCourses`/`savedCourseDetail`, `stats`, `lodgingPicker`,
  `myFeed`/`feedWrite`/`feedLocationPicker`)은 **팀과 먼저 확인하지 않고 포팅하지 않는다** — 각각
  더 새롭고 실제로 쓰이는 시스템과 중복된다.
- `src/components/my`는 탭이 어떻게 구조화되어야 하는지 보여주는 참조 구현이다(프레젠테이션
  컴포넌트 + `computeMyBadges` 같은 `src/lib`의 순수 함수로 파생 데이터 계산 + 스토어/훅을
  엮어주는 페이지). `map`/`schedule`/`feed`/`home`에도 이 구조를 그대로 따른다.

## 팀 협업 (3인 분업)

3명의 FE가 각자 Claude Code 세션을 띄워 동시에 작업해도 파일이 겹치지 않도록, PLAN.md §2 폴더 구조를
기준으로 **탭 경계로 담당을 나눈다.** 각자 세션을 시작할 때 "나는 Player N이다, 담당 범위는 아래
표 참고"라고 알려주면 담당 밖 파일을 건드리지 않도록 유도할 수 있다. My 탭은 STEP 2에서 이미 완성된
참조 구현이므로 별도 담당자가 없다 — 세 명 모두 그 구조를 컨벤션으로 삼는다.

### 담당 범위

| | 담당 탭/화면 | 소유 디렉터리 | 비고 |
|---|---|---|---|
| **Player 1** | 홈(HOME) + 다녀지도(MAP) | `app/(shell)/home/`, `app/(shell)/map/`, `app/place/[name]/`(placeDetail·reviewWrite), `app/settings/ai/`(aiSettings), `src/components/place/` | 장소 데이터가 핵심이라 여러 탭에서 열리는 `placeDetail`을 1순위로 소유. `festival`의 `preview` 변형도 포함 |
| **Player 2** | 내 여정(SCHEDULE) | `app/(shell)/schedule/` 전체(코스 위저드 mbti/manual, vault, `[courseId]` 상세·일정추가·공유, `festival`의 `full` 변형), `app/onboarding/mbti-*`(MBTI 플로우는 스케줄과 공유), `src/components/course/`, `src/components/mbti/`, `PlacePickerSheet` + `useSheetStore` | 프로토타입에서 가장 복잡했던 탭이라 단독 배정. 코스 생성 위저드는 PLAN.md §4-1대로 스텝을 `steps/` 폴더에 파일 분할해서 작업 |
| **Player 3** | 둘러보기(FEED) + 온보딩/인증 + MY 탭 확장 | `app/(shell)/feed/`, `app/feed/post/[postId]/`, `app/article/[id]/`(articleDetail), `app/onboarding/`(`page.tsx`, `signup/`, `pet-register/`), `src/components/feed/`, `src/components/onboarding/PetRegisterForm` | STEP 2에서 스텁만 있는 `PetRegisterForm`을 완성해 온보딩·My탭 수정 양쪽에서 재사용(PLAN.md §4-2). My탭 자체는 이미 완성돼 있으니 그 안의 `TODO(step3)` 연결(패스포트 카드 클릭 → 등록/수정 폼)만 이어받는다 |

### 공용 리소스 규칙

- `src/components/ui/*`(Button, Card, Tag, Modal, BottomSheet, Toast)는 STEP 2에서 이미 완성됨. 새
  primitive가 필요하면 조용히 각자 비슷한 걸 만들지 말고, 먼저 다른 두 명에게 알리고 추가한다.
- `src/mocks/*`, `src/types/*`는 도메인별 파일로 이미 나뉘어 있다(`places.ts`=Player1,
  `courses.ts`=Player2, `posts.ts`/`articles.ts`=Player3 …). 다른 사람의 mock/타입 파일에 필드가
  부족하면 직접 고치지 말고 요청한다 — 같은 타입을 여러 화면이 동시에 참조하기 때문에 조용히 바꾸면
  다른 사람 화면이 깨진다.
- `src/stores/*` 중 `useAuthStore`/`usePetStore`/`useToastStore`는 공용(이미 완성, 읽기 전용으로만
  사용). 탭 전용 상태(예: 코스 작성 draft)는 새 스토어를 추가하되 해당 Player가 소유한다.
- `placeDetail`·`articleDetail`·`aiSettings`처럼 탭 경계를 넘어 여러 화면에서 열리는 공용 라우트는
  위 표의 1순위 소유자가 구현하고, 다른 Player는 링크만 걸고 내부 구현은 건드리지 않는다.
- 레거시/오펀 화면 8종(위 컨벤션 항목 참고)은 담당 탭 안에 있어도 포팅 금지 — 예외 없음.

### 작업 방식

- 브랜치는 담당 단위로 분리한다(예: `feat/player1-home-map`). 커밋은 화면/스텝 단위로 작게 쪼갠다.
- 각자 세션 시작 시 Claude Code에 "나는 Player N — 담당 범위는 CLAUDE.md 팀 협업 표 참고"라고 알려주고,
  `src/components/my`(참조 구현)와 PLAN.md §2 폴더 구조를 그대로 컨벤션으로 따르게 한다.
