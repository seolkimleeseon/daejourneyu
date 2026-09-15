# Daejourneyu — 프로젝트 기초 세팅

**Daejourneyu** = Dae(대전) + journey + 유(충청 사투리 / "you")
반려동물과 함께하는 대전 여행 플랫폼. 로고 워드마크는 `DaeJourneyU` (끝 U 강조 → journey with **you**).

Next.js 14 (App Router) + TypeScript + PWA 프론트엔드 / Node.js(Express) + TypeScript 백엔드.

```
daejourneyu-starter/
├─ frontend/                 # Next.js + TS + PWA
│  ├─ app/
│  │  ├─ layout.tsx          # 루트 레이아웃 (manifest·테마색·Pretendard)
│  │  ├─ page.tsx            # 홈 (백엔드 /api/places 연동 예시)
│  │  └─ globals.css         # 디자인 토큰(티일 팔레트)
│  ├─ public/
│  │  ├─ manifest.json       # PWA 매니페스트
│  │  └─ icons/              # icon-192.png / icon-512.png 넣기
│  ├─ next.config.mjs        # next-pwa + /api 프록시
│  ├─ tsconfig.json
│  └─ package.json
└─ backend/                  # Node.js + Express + TS
   ├─ src/
   │  ├─ index.ts            # 서버 진입점 (CORS·라우트)
   │  └─ routes/places.ts    # /api/places
   ├─ tsconfig.json
   └─ package.json
```

## 실행 방법

로컬 개발에는 **DB · 백엔드 · 프론트 세 가지**가 떠 있어야 한다. DB는 백그라운드로 돌기 때문에
터미널을 잡지 않고, 백엔드·프론트가 터미널 하나씩 쓴다.

### 0) DB — 터미널 안 잡음 (백그라운드)
```bash
cd backend
npm run db:up        # Prisma 로컬 Postgres 기동 (localhost:51214). 이미 떠 있으면 그대로 재사용
```

**DB는 `npm run dev`에 딸려 오지 않는다.** 재부팅·절전으로 꺼져도 백엔드·프론트는 멀쩡히 뜨고
화면도 그려지기 때문에, 증상이 DB와 무관해 보이는 곳에서 나타난다 — 카카오 로그인이
`?error=kakao_db`로 되돌아오거나, 로그인·가입 API가 500을 뱉는 식이다.
**인증 계열이 갑자기 안 되면 카카오 콘솔을 뒤지기 전에 DB 상태부터 확인한다.**

| 명령 | 하는 일 |
|---|---|
| `npm run db:up` | 기동 (`prisma dev --name daejourneyu --detach`) |
| `npm run db:ls` | 상태 확인 — `status`가 `running`인지 본다 |
| `npm run db:stop` | 정지 |

DB를 다시 띄운 뒤 백엔드를 재시작할 필요는 없다 — Prisma가 다음 쿼리에서 알아서 재연결한다.
접속 URL은 `backend/.env`의 `DATABASE_URL`이 정본이다.

### 1) 백엔드 (터미널 A)
```bash
cd backend
npm install
npm run dev          # http://localhost:4000  (tsx watch)
```

### 2) 프론트엔드 (터미널 B)
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```
브라우저에서 http://localhost:3000 접속.

## PWA
- `public/manifest.json` + `next-pwa`로 서비스워커 자동 생성 (프로덕션 빌드 시).
- **아이콘 필요**: `public/icons/icon-192.png`, `icon-512.png` 를 넣어주세요 (프로토타입 로고 SVG → PNG export).
- 개발 모드에선 SW 비활성(`disable: NODE_ENV==='development'`). 테스트는 `npm run build && npm start`.

## 브랜딩
- 앱 표시명: **Daejourneyu** / 워드마크: `DaeJourneyU`
- 공식 로마자 병기 필요 시: `Daejeoniyu`
- 태그라인 예: *"Journey Daejeon, with you & your dog."*
- 팔레트: Main #35AD90 / Orange #FF8A3D / Navy #183B56 / Blue #4F7CF7

## 다음 단계 (권장)
- **DB**: Prisma + PostgreSQL (또는 Supabase) — `routes`의 임시 배열을 DB 쿼리로 교체
- **데이터패칭**: TanStack Query (React Query)
- **지도**: 카카오맵 (`react-kakao-maps-sdk`)
- **인증**: NextAuth.js (카카오 로그인)
- **배포**: 프론트 = Vercel, 백엔드 = Railway/Render, DB = Supabase
