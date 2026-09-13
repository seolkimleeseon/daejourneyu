# PLAN.md — 프로토타입 → Next.js 리액트 전환 계획 (STEP 1)

> 이 문서는 `daejeoniyou_v260801_clean12.html` 단일 파일 프로토타입(순수 JS, 커스텀 `historyStack` 라우터)을
> Next.js(App Router) + TS + Tailwind + TanStack Query + Zustand 로 옮기기 위한 STEP 1 산출물이다.
> **코드는 아직 없다.** 승인 후 STEP 2에서 스캐폴딩을 시작한다.

스택 변경 메모: 원 지시에는 Vite + React Router였으나, 이 저장소(`frontend/`)가 이미 Next.js 14 스캐폴드이므로
**Next.js App Router로 대체**하기로 확정함(React Router 미사용). TanStack Query / Zustand / Tailwind는 그대로 유지.

---

## 1. 화면(스크린) 인벤토리 — 5개 탭 트리

프로토타입의 `screens` 객체를 전수 조사하고, 각 화면의 `setNav(activeTab, ...)` 첫 인자로 소속 탭을 추적했다.
하단 네비게이션의 `data-tab` 은 `map | schedule | home | feedTab | my` 5개뿐이라, 이와 매칭되지 않는 화면은
"탭에 속하지 않는 공용/온보딩 화면"으로 별도 분류했다.

```
[온보딩 / 인증] — 하단 네비 없음
├─ onboarding
├─ signup
├─ petRegister            ⚠ 온보딩 진입점이면서 MY 탭 "정보 수정"에서도 재사용됨(2개 진입점)
└─ mbtiOnboardIntro
   └─ mbtiQuestion → mbtiResult   (공용 화면, 아래 SCHEDULE/HOME 코스 생성 플로우에서도 재사용)

[공용 모달] loginModal · logoutModal · leaveConfirmModal(이탈 확인) · easterEggModal · toast
[공용 오버레이] jvSheet/jvDim(장소 선택 바텀시트) · splash

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: HOME (홈)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
home
├─ placeDetail            ★공용: map/feed/chatbot에서도 진입
│  ├─ reviewWrite          (로그인 필요)
│  └─ aiSettings           ★공용: chatbot에서도 진입
├─ articleDetail          ★공용: FEED 탭 "아티클" 서브탭과 공유
├─ chatbot                 ⚠ setNav('chatbotTab', …) — 하단 네비 data-tab에 'chatbotTab'이
│                            없어 실제로는 어떤 탭도 하이라이트되지 않음(사실상 전체화면 모달급 페이지)
│  ├─ aiSettings
│  └─ placeDetail
├─ festival (mode 기본값=preview)   ★공용: SCHEDULE의 'mode:full' 변형과 동일 화면 재사용
└─ [MBTI 코스 만들기 진입] → mbtiIntro/jvMbtiResult → … → 코스 생성 플로우(SCHEDULE 참고, 탭 넘나듦)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: MAP (댕댕지도)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
map   (내부 상태머신: districts → traveling(연출) → list — 별도 라우트 아님, 컴포넌트 내부 state)
└─ placeDetail

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: SCHEDULE (내 여정) — 가장 복잡한 탭
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
schedule (내부 세그: 내 코스 / 캘린더)
├─ [코스 만들기 진입 카드 3종]
│  ① MBTI 코스: mbtiIntro/jvMbtiResult → mbtiQuestion → mbtiResult
│                 → themePicker(퀴즈 건너뛰기 대안 경로) → courseOptions → tripConditions
│                 → courseTransport → (lodgingPicker ⚠아래 참고) → courseResult → 저장(jyCourses)
│  ② AI 챗봇 코스: chatbot (HOME과 공용)
│  ③ 직접 짓기: jvManual1 → jvManual2(+ jvSheet 장소선택 오버레이) → jvManual3 → 저장
├─ jvVault (보관함 전체 보기)
├─ journeyCourseDetail (코스 상세 — 예정된 경우 D-day/준비물 체크리스트 노출)
│  ├─ journeyScheduleAdd (일정 추가/편집 + 인근 축제 매칭)
│  └─ journeyShare (코스 공유 → FEED '내 글'에 게시됨 · setNav는 'feedTab' 사용)
├─ jvMbtiResult (MBTI 결과 재열람 겸 코스 만들기 진입)
└─ festival (mode:'full' 변형) ⚠ 코드 전체에서 이 모드로 진입하는 호출부를 찾지 못함(오펀 가능성)

  ⚠⚠ SCHEDULE 도메인 내 "레거시/중복 시스템" 감지 — 그대로 이식하지 말 것, 팀 확인 필요:
  · manualCourseDays → placeBrowse → placeSearch → myCourseResult
    : PLACES/selectedPlacesByDay/nearestNeighborRoute 기반의 "구버전 수동 코스 짓기" 플로우.
      jvManual1-3(신버전, jyDB/jvNnFrom 기반)와 기능이 겹친다. manualCourseDays 로 진입하는
      goScreen() 호출부를 코드 전체에서 찾지 못함 → 죽은 진입점으로 추정.
  · savedCourses / savedCourseDetail
    : 코스를 하나의 flat 배열로 저장하던 구버전 시스템. 현재는 jyCourses(source: ai|manual|saved)
      + jySchedules(캘린더 날짜 매핑) 이원 구조로 대체됨. jySyncBaseSavedCourses() 가 구→신 데이터를
      브리징하는 코드가 남아있어 리팩터 도중 정리가 안 된 흔적으로 보임.
  · stats 화면: 코드 전체에서 진입 호출부를 찾지 못함 — 죽은 화면으로 추정.
  · lodgingPicker: courseStepbar가 4단계(기간/조건/이동/코스)뿐이고 "숙소" 단계가 없음.
      courseTransport → courseResult 로 바로 연결되어 lodgingPicker 진입 호출부가 없음 — 오펀.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: FEED (둘러보기)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
feed (renderBrowseMerged — 내부 세그: 코스 / 아티클 / 내 글)
├─ journeyPostDetail (공유된 코스 상세)
├─ articleDetail   ★공용(HOME과 동일 화면)
└─ journeyShare    (SCHEDULE의 journeyCourseDetail에서 진입, 완료 후 이 탭 '내 글'로 복귀)

  ⚠ FEED 도메인 내 레거시 감지:
  · myFeed, feedWrite, feedLocationPicker + feedPosts/comments 배열
    : "짧은 글 피드" 구버전 시스템. 현재 라이브 FEED 탭(renderBrowseMerged)은 전부 jyPosts(코스 공유)
      기반으로 동작하며 feedPosts를 읽는 도달 가능 화면이 없음 — 포팅 여부 팀 확인 필요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: MY (마이)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
my
├─ petRegister (수정 모드, 온보딩과 공유)
└─ myReviews ("내가 쓴 후기" — 현재 실사용 중인 reviews 배열, placeDetail의 후기 목록과 직결)
```

**요약**: 살아있는 화면 그래프는 총 34개 route-급 화면 + 5개 탭 루트. 이 중 **레거시/오펀으로 의심되는 화면 8개**
(`manualCourseDays, placeBrowse, placeSearch, myCourseResult, savedCourseDetail, stats, lodgingPicker`,
그리고 `myFeed, feedWrite, feedLocationPicker` 묶음)는 **1차 포팅 범위에서 제외**하고, STEP 2 착수 전 팀에
"이거 실제로 쓰나요?" 한 번 확인받는 걸 권장한다. 잘못 포팅하면 신버전과 구버전 두 개의 코스 저장 시스템을
같이 만드는 꼴이 된다.

---

## 2. 폴더 구조 제안 (Next.js App Router)

```
frontend/
├─ app/
│  ├─ layout.tsx                     # 폰트, PWA manifest, QueryClientProvider, 전역 오버레이 마운트
│  ├─ globals.css                    # 디자인 토큰(CSS 변수) + Tailwind base
│  │
│  ├─ (shell)/                       # 하단 탭 네비가 보이는 라우트 그룹
│  │  ├─ layout.tsx                  # <AppShell>(TopBar+BottomNav) 로 children 감쌈
│  │  ├─ home/
│  │  │  ├─ page.tsx
│  │  │  ├─ festival/page.tsx        # 홈 하단 "축제 캘린더" 진입
│  │  │  └─ chatbot/page.tsx         # 탭 하이라이트 없는 화면이지만 홈 하위 라우트로 배치
│  │  ├─ map/
│  │  │  └─ page.tsx                 # districts/traveling/list는 내부 state로 처리(별도 라우트 X)
│  │  ├─ schedule/
│  │  │  ├─ page.tsx                 # 내 코스 / 캘린더 세그
│  │  │  ├─ vault/page.tsx
│  │  │  ├─ mbti-result/page.tsx
│  │  │  ├─ course/
│  │  │  │  ├─ new/                  # 코스 생성 위저드(마법사) — 라우팅 방식은 §4 결정사항 참고
│  │  │  │  │  ├─ mbti/page.tsx
│  │  │  │  │  └─ manual/page.tsx
│  │  │  │  └─ [courseId]/
│  │  │  │     ├─ page.tsx           # journeyCourseDetail
│  │  │  │     ├─ schedule/page.tsx  # journeyScheduleAdd
│  │  │  │     └─ share/page.tsx     # journeyShare
│  │  │  └─ festival/page.tsx        # mode:'full' 변형
│  │  ├─ feed/
│  │  │  ├─ page.tsx
│  │  │  └─ post/[postId]/page.tsx   # journeyPostDetail
│  │  └─ my/
│  │     ├─ page.tsx
│  │     └─ reviews/page.tsx
│  │
│  ├─ place/[name]/
│  │  ├─ page.tsx                    # placeDetail — 여러 탭에서 진입하는 공용 화면, 탭 밖에 최상위 배치
│  │  └─ review/page.tsx             # reviewWrite
│  ├─ article/[id]/page.tsx          # articleDetail — 공용
│  ├─ settings/ai/page.tsx           # aiSettings — 공용
│  └─ onboarding/
│     ├─ page.tsx
│     ├─ signup/page.tsx
│     ├─ pet-register/page.tsx       # PetRegisterForm 재사용(§4 참고), My탭 수정도 이 컴포넌트 사용
│     ├─ mbti-intro/page.tsx
│     ├─ mbti-quiz/page.tsx
│     └─ mbti-result/page.tsx
│
├─ src/
│  ├─ components/
│  │  ├─ shell/        AppShell, TopBar, BottomNav, Splash
│  │  ├─ ui/            Button, Card, Tag, BottomSheet, Toast, Modal, ProgressSteps
│  │  ├─ place/          PlaceCard, PlaceDetailHeader, PetBanner, CrowdTicker, MapPins, RouteMap
│  │  ├─ course/          CourseCard, DayTabs, RouteList, ChecklistItem, CourseStepBar
│  │  ├─ mbti/             QuestionCard, TraitChip, ThemeBar
│  │  └─ feed/              PostCard, ArticleCard
│  ├─ stores/            (zustand) useAuthStore, usePetStore, useCourseDraftStore, useUiStore(toast/모달/시트)
│  ├─ mocks/              places.ts, courses.ts, reviews.ts, posts.ts, articles.ts, festivals.ts, users.ts
│  ├─ types/               domain 타입 (User, Pet, Place, Course, Review, FeedPost, Festival, Article …)
│  ├─ lib/                  haversine.ts, nearestNeighborRoute.ts, dateUtils.ts, api/(TODO(api) 스텁)
│  └─ hooks/                usePlaces, useCourses … (지금은 mocks를 감싸는 TanStack Query 훅)
│
├─ CLAUDE.md              (STEP 2에서 팀 컨벤션 반영해 갱신)
└─ PLAN.md                (본 문서)
```

### "마이(MY)" 탭이 참조 템플릿인 이유
가장 단순하면서도 대표 패턴(패스포트 카드, 뱃지 그리드, 메뉴 리스트, 로그인 게이팅)을 다 담고 있어
STEP 2에서 완성해 나머지 2명이 따라 만들 기준으로 삼기 적합하다.

---

## 3. 디자인 토큰 표 (`:root` 추출)

### 색상

| 프로토타입 변수 | 값 | 제안 Tailwind 토큰명 | 비고 |
|---|---|---|---|
| `--green` | `#35AD90` | `brand-DEFAULT` / `brand-600` | 메인 브랜드색. 기존 `app/globals.css`의 `--main`과 동일값 |
| `--green-light` | `#D7F2EB` | `brand-100` | `--sub20`과 동일값(중복 변수) |
| `--green-dark` | `#1E7D64` | `brand-700` | |
| `--sub80` | `#4FBAA0` | `brand-500` | |
| `--sub60` | `#72C8B3` | `brand-400` | |
| `--sub40` | `#A0DDD0` | `brand-300` | |
| `--sub20` | `#D7F2EB` | `brand-100` | `--green-light`와 중복 |
| `--purple` | `#4F7CF7` | `accent-purple` | `--blue`와 동일값(중복 변수) |
| `--purple-light` | `#E7EDFD` | `accent-purple-light` | |
| `--blue` | `#4F7CF7` | `accent-purple` | `--purple`과 동일값 — 하나로 통합 권장 |
| `--amber` | `#B8891C` | `accent-amber` | |
| `--amber-light` | `#FDF3D2` | `accent-amber-light` | |
| `--coral` | `#FF8A3D` | `accent-coral` | |
| `--coral-light` | `#FFE9D6` | `accent-coral-light` | |
| `--navy` | `#183B56` | `accent-navy` | 사용처 희소 — STEP2에서 실사용 확인 |
| `--bg` | `#F8F9FA` | `surface-bg` | |
| `--card` | `#FFFFFF` | `surface-card` | |
| `--border` | `#ECEFF1` | `border-DEFAULT` | `--g200`과 동일값 |
| `--border-strong` | `#D5DADF` | `border-strong` | `--g300`과 동일값 |
| `--text` | `#253039` | `text-DEFAULT` | `--g700`과 유사(다른 값이니 별도 유지) |
| `--muted` | `#6B7682` | `text-muted` | `--g600`과 동일값 |
| `--g100`~`--g700` | `#F8F9FA…#3F4752` | `gray-100`~`gray-700` | 7단 그레이 스케일 |

⚠ **중복/불일치 발견**: `.jv` 스코프(코스/피드 화면 전용)가 루트와 별개로 `--mint*, --pink*, --amber-d/dd,
--coral-d, --purple-l, --surf, --bd/--bd2, --text2` 라는 **거의 같은 의미의 두 번째 팔레트**를 재정의하고
있다(주석상 "file 2 디자인" 이식 흔적). React 전환 시 **팔레트를 하나로 통합**해야 하며, 두 벌을 그대로
Tailwind에 옮기면 색이 컴포넌트마다 미묘하게 달라지는 버그의 근원이 된다. STEP 2에서 `.jv` 쪽 값을
기준으로 통일할지, 루트 쪽을 기준으로 할지 결정 필요(둘이 hex가 정확히 같지 않음 — 예: `--pink:#183B56`
는 `--navy`와 동일하지만 명명이 다름).

또한 기존 `frontend/app/globals.css`(현재 Next.js 스캐폴드)에 이미 더 작은 토큰 세트(`--main, --sub80,
--orange, --yellow` 등)가 있는데, `--main`/`--sub*` 값은 이 프로토타입과 정확히 일치한다. STEP 2에서
이 프로토타입 토큰 표로 **확장 교체**하면 된다.

### 폰트

| 변수 | 값 | 비고 |
|---|---|---|
| `--font` | `'Pretendard', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | 본문 기본 폰트(CDN `pretendard.css` 로드) |
| `--font-round` | `'Jua', 'Pretendard', sans-serif` | 정의만 있고 실사용처를 찾지 못함 — STEP2에서 필요 여부 확인 |
| `--mono` | `ui-monospace, 'SFMono-Regular', Menlo, monospace` | 스플래시 태그, 상태카드 상단 스트립 등 라벨용 |

### 간격 · 반경 (CSS 변수로 토큰화되어 있지 않음 — 하드코딩 값에서 스케일 역산)

프로토타입은 spacing/radius를 변수화하지 않고 리터럴로 반복 사용한다. Tailwind config에 넣을 스케일을
관찰값 기반으로 제안:

| 용도 | 관찰된 값 | 제안 스케일명 |
|---|---|---|
| border-radius (칩/작은 버튼) | `8px` | `rounded-md` |
| border-radius (카드/인풋) | `12px` | `rounded-lg` |
| border-radius (큰 카드/버튼) | `16px` | `rounded-xl` |
| border-radius (시트/히어로카드) | `20px`~`24px` | `rounded-2xl` |
| border-radius (필/완전 원형) | `999px` | `rounded-full` |
| 간격(gap/padding) | `4,6,8,10,12,14,16,20px` | Tailwind 기본 스케일(`1,1.5,2,2.5,3,3.5,4,5`)에 그대로 대응 가능 |
| 폰트 크기 | `9,10,11,12,13,14,15,16,18,20,24px` | Tailwind 기본 `text-*` 스케일과 대부분 호환, `9/11/15px`처럼 낀 값만 커스텀 필요 |

---

## 4. STEP 2 착수 전 결정 사항 — 권장안 (유지보수 우선)

3인 팀 + 9월 중순 마감이라는 조건에서는 "지금 더 유연한 구조"보다 "누가 봐도 어디를 고쳐야 할지
바로 아는 구조"가 이긴다. 아래는 그 기준으로 정한 권장 방향이다. 승인해주면 이 방향으로 확정하고
STEP 2에 반영한다.

1. **코스 생성 위저드 라우팅 방식** → **단일 라우트 + 내부 스텝 state**로 결정 권장.
   URL을 스텝마다 나누면(`/course/new/mbti/step-2` 등) 라우트 파일이 5~6개씩 늘어나고, 스텝 간
   공유 상태(선택한 테마·기간·조건)를 URL 파라미터나 서버 상태로 왕복시켜야 해서 목데이터 단계에서는
   오히려 복잡도만 늘어난다. 프로토타입도 이미 이 방식(커스텀 `historyStack`)이라 1:1 포팅이 쉽다.
   대신 **파일 분할로 병렬 작업 문제를 해결**: 각 스텝을 `features/course-wizard/steps/ThemeStep.tsx`
   식으로 별도 파일로 쪼개고, 라우트 컴포넌트는 스텝 배열을 돌리는 얇은 오케스트레이터로만 둔다.
   이러면 팀원 3명이 스텝 파일을 나눠 가져도 충돌이 안 난다.

2. **petRegister 재사용** → **`<PetRegisterForm mode="create" | "edit">` 공유 컴포넌트**로 확정 권장.
   프로토타입의 `savePetProfile()`이 이미 생성/수정 분기를 한 함수 안에서 처리하다가 로직이 꼬여 있던
   부분이라(신규 추가 vs 기존 수정 vs 최초 온보딩 3갈래), React에서는 폼 자체를 한 컴포넌트로 못박고
   온보딩/마이탭 페이지는 그 컴포넌트를 부르는 껍데기만 두는 게 버그를 원천 차단한다.

3. **jvSheet(장소 선택 바텀시트)** → **하나의 제네릭 `<PlacePickerSheet>` + `useSheetStore`(zustand)**로 확정 권장.
   프로토타입에 `jvOpenPicker` / `jvOpenSchedPicker` 두 함수가 파라미터(제외 목록, 카테고리 필터,
   선택 콜백)만 다를 뿐 거의 동일한 HTML 생성 로직을 복붙해놓은 상태다. React에서 이걸 그대로 옮기면
   "장소 선택 UI 버그 하나를 두 군데 고쳐야 하는" 유지보수 함정에 그대로 빠진다. 처음부터 하나로 합친다.

4. **레거시 화면 8종** → **1차 포팅에서 전부 제외**하는 걸 권장. 이유는 순전히 유지보수 리스크다 —
   지금 옮기면 "코스 저장" 같은 핵심 기능에 신/구 두 시스템이 공존하게 되고, 팀원이 어느 쪽을 고쳐야
   할지 매번 확인해야 한다(프로토타입에 이미 `jySyncBaseSavedCourses()`라는 신↔구 브리징 코드가
   남아있는 게 그 부작용의 증거). 정말 필요한 기능(예: `stats`가 실제 요구사항이라면)은 죽은 코드를
   억지로 되살리기보다 새 데이터 모델(`jyCourses`/`jySchedules`) 기준으로 새로 짜는 게 더 빠르고 깨끗하다.

5. **`.jv` vs 루트 팔레트 통합** → **루트(`:root`) 네이밍을 기준(source of truth)으로 채택**하는 걸 권장.
   이미 기존 `app/globals.css`가 루트 쪽 네이밍(`--main`, `--sub*`)을 쓰고 있어 일관성이 맞고, 이름 체계도
   `.jv` 쪽(mint/pink)보다 더 명확하다(실제로 `.jv`의 `--pink:#183B56`는 루트 `--navy`와 동일 hex,
   `--text2:#6B7682`는 루트 `--muted`와 동일 hex — 이름만 다른 중복이 다수 확인됨).
   다만 전부가 완전 동일값은 아니다 — 예: `.jv --amber-d:#8A6A12` vs 루트 `--amber:#B8891C`처럼
   미묘하게 다른 톤도 섞여 있다. 이건 코드만 봐서는 "의도된 변형"인지 "타이핑 실수"인지 구분이 안 되므로,
   Tailwind 토큰을 확정하기 전에 **두 팔레트가 실제 화면에서 어떻게 보이는지 캡처 비교하는 짧은 QA 패스**를
   STEP 2 초반에 넣는 걸 제안한다(코드 리딩만으로 색상값 최종 결정을 내리는 건 위험).

---

## 승인 대기 중

STEP 1은 여기까지. 화면 트리 / 폴더 구조 / 토큰 표 + 위 §4 권장안을 검토해줘. 이대로 진행해도 되면
STEP 2(스캐폴딩)로 넘어간다.
