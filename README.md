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
브라우저에서 http://localhost:3000 접속 → 백엔드의 장소 목록이 보이면 연동 성공.

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
