# 배포 가이드

2026-09-01, 팀 내부/스테이징 확인용으로 처음 배포하면서 정리한 문서. 여기 적힌 순서·주의사항은
그날 실제로 겪은 실패를 그대로 반영한 것이라, 다음에 재배포하거나 팀원이 새로 세팅할 때 이 순서를
따라가면 같은 함정을 다시 밟지 않는다.

## 아키텍처

```
Vercel (frontend/)  --/api/*rewrite-->  Railway (backend/)  --Prisma-->  Supabase (Postgres)
```

- **프론트**: Vercel. Next.js가 처음부터 지원 대상이라 App Router/PWA 설정 손볼 것 없이 그대로 동작.
- **백엔드**: Railway. Express 서버를 컨테이너로 그냥 띄우는 방식이라 서버리스 제약(cold start,
  타임아웃) 없이 기존 코드 그대로 동작.
- **DB**: Supabase(Postgres). `backend/CLAUDE.md`에 최종 방향으로 이미 적혀있던 선택이고,
  내부적으로 AWS RDS 기반이라 나중에 AWS로 이전해도 `DATABASE_URL`만 바꾸면 됨.

로컬 개발 흐름(`npx prisma dev`로 로컬 Postgres)과는 별개로, 이 문서는 **실제로 인터넷에 뜨는
배포**를 다룬다.

## 현재 배포된 곳

| | URL | 비고 |
|---|---|---|
| 프론트 | https://daejourneyu.vercel.app | Vercel 프로젝트 `daejourneyu` (owner: bagoye) |
| 백엔드 | https://daejourneyu-production.up.railway.app | Railway 프로젝트, 서비스명 `daejourneyu` |
| DB | Supabase 프로젝트 `daejourneyu` (ap-northeast-1, Tokyo) | Organization: `daejourneyu` |

## 필요한 계정

Vercel, Railway, Supabase 전부 GitHub 계정으로 로그인 가능. 세 서비스 다 **GitHub 조직
`seolkimleeseon`에 대한 저장소 접근 권한**이 있어야 레포를 검색해서 연결할 수 있다 — 조직 멤버인데도
안 보이면 `github.com/organizations/seolkimleeseon/settings/installations`에서 해당 서비스의
GitHub App이 이 레포(또는 전체 레포)에 접근 허용돼 있는지 먼저 확인한다(Owner 권한 필요).

## 1. Supabase — DB

1. supabase.com에서 Organization 생성(Free plan) → 그 안에서 project 생성
   - Region: Seoul 있으면 Seoul, 없으면 Tokyo
   - Database Password는 **자동생성 버튼으로 만들고 그대로 복사해서 보관** — 직접 타이핑하면
     오타·IME(한/영 전환) 문제로 잘못 저장되기 쉽다(아래 "겪은 문제" 참고)
   - Security 섹션의 **Data API / Automatically expose new tables / Enable automatic RLS는
     전부 꺼도 된다** — 이 프로젝트는 `supabase-js`를 안 쓰고 Prisma가 DB에 직접 붙는 구조라
     Supabase의 REST API(PostgREST) 자체를 안 쓴다. Data API를 끄면 "supabase-js를 못 쓴다"는
     경고가 뜨는데, 애초에 안 쓰므로 무시하고 진행한다.
2. 프로젝트 생성되면 우측 상단 **Connect** 버튼 → **ORM 탭 → Prisma** 선택 → 나오는 두 값을
   `backend/.env`에 그대로 붙여넣는다:
   ```
   DATABASE_URL="postgresql://postgres.<ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.<ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres"
   ```
   `DATABASE_URL`(6543, 트랜잭션 풀러)은 앱 런타임용, `DIRECT_URL`(5432, 세션 풀러)은 마이그레이션
   전용 — Supabase+Prisma 공식 권장 패턴이라 `backend/prisma/schema.prisma`의 `datasource`에
   `directUrl = env("DIRECT_URL")`이 이미 반영돼 있다.
3. **`[YOUR-PASSWORD]`를 실제 비밀번호로 통째로 교체한다 — 대괄호까지 같이 지울 것.** 대괄호를
   안에 텍스트만 바꾸고 남겨두면 Postgres가 `[...]`가 포함된 문자열 전체를 비밀번호로 인식해서
   `P1000: Authentication failed`가 난다.
4. `cd backend && npx prisma migrate deploy`로 스키마 반영. 성공하면 "N migrations found... All
   migrations have been successfully applied."가 뜬다.

## 2. Railway — 백엔드

1. railway.app → GitHub 로그인 → **New Project → Deploy from GitHub repo** → `daejourneyu` 검색
2. **⚠ 반드시 할 것 — Settings > Source > Root Directory를 `backend`로 지정.**
   레포 루트에는 `backend/`, `frontend/`, `docs/`가 나란히 있어서 지정 안 하면 Railway의 빌더
   (Railpack)가 "빌드 방법을 못 찾겠다"며 실패한다(`Root Directory` 입력창 밑의 "Add Root
   Directory" 링크를 눌러야 입력창이 나타난다 — 처음엔 안 보여서 헤맬 수 있음). 값 넣고 우측 상단
   **Deploy** 버튼까지 눌러야 실제로 적용된다.
3. **Branch connected to production**을 `develop`으로 지정(기본값이 `main`일 수 있음).
4. **Variables** 탭(또는 Raw Editor)에 아래 등록:
   - `DATABASE_URL`, `DIRECT_URL` — 1번에서 만든 Supabase 값
   - `JWT_SECRET` — **로컬 `.env` 값을 재사용하지 말고 새로 발급**(`openssl rand -hex 32`)
   - `PUBLIC_DATA_API_KEY`, `ANTHROPIC_API_KEY`, `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`
   - `FRONTEND_ORIGIN`, `KAKAO_REDIRECT_URI`는 3번(Vercel) 끝나고 도메인이 나온 뒤에 채운다(닭과
     달걀 관계 — 순서 문제일 뿐 지금 비워둬도 서버는 정상 기동한다)
5. **Settings > Networking > Generate Domain**으로 공개 URL 발급.
6. `curl https://<도메인>/api/health`로 `{"ok":true}` 확인. `/api/places` 같은 DB 쿼리 라우트가
   502가 나면 Variables 저장 후 재배포가 아직 안 끝난 경우가 많다 — 몇십 초 뒤 다시 확인.

## 3. Vercel — 프론트

1. vercel.com → GitHub 로그인 → **Add New... > Project** → `daejourneyu` 선택
2. **⚠ 여기도 Root Directory를 `frontend`로 지정.** (Railway와 똑같은 실수 포인트)
3. **Environment Variables**에 등록:
   - `NEXT_PUBLIC_KAKAO_JS_KEY` — `frontend/.env.local` 값
   - `BACKEND_ORIGIN` — 2번의 Railway 도메인(`https://...up.railway.app`, 끝에 슬래시 없이)
4. Deploy.
5. Railway로 돌아가서 `FRONTEND_ORIGIN`(이번에 나온 Vercel 도메인), `KAKAO_REDIRECT_URI`
   (`https://<Railway 도메인>/api/auth/kakao/callback`) 채워 넣고 재배포.
6. 카카오 개발자 콘솔(developers.kakao.com) → 플랫폼 > Web에 Vercel 도메인 등록, 카카오 로그인 >
   Redirect URI에 5번 값 등록.

### ⚠ Production Branch 관련 — 아직 미해결

Vercel 프로젝트를 처음 Import하면 **GitHub 기본 브랜치(`main`)를 Production Branch로 잡는다.**
이 저장소는 `main`에 STEP 2 스캐폴딩만 있고 실제 기능(로그인, 코스 생성, 장소 데이터, 챗봇 등)은
전부 `develop`에만 있어서, 아무 설정도 안 바꾸면 **화면은 뜨는데 최신 기능이 하나도 없는 버전이
배포된다.** `next.config.mjs`의 env var 처리(`BACKEND_ORIGIN`)도 `develop`에만 있어서 `/api/*`
프록시가 `DNS_HOSTNAME_RESOLVED_PRIVATE` 에러로 실패하는 것도 같은 원인이다.

2026-09-01 시점엔 새 Vercel 대시보드 UI에서 프로젝트별 "Production Branch" 설정 위치를 찾지
못해서(계정 전체 Git 설정과 프로젝트 개별 설정이 UI상 헷갈리게 나뉘어 있음), 임시로 아래처럼
**로컬 `develop` 체크아웃을 직접 프로덕션으로 배포**하는 방식으로 우회했다:

```bash
npx vercel link      # 최초 1회, 프로젝트 연결
git checkout develop && git pull
npx vercel --prod    # 로컬 파일을 그대로 프로덕션에 배포 (GitHub 연동과 무관)
```

이건 **1회성 스냅샷**이라, 나중에 누군가 `main`에 push하면 Vercel의 GitHub 연동이 자동으로 그걸로
다시 덮어쓸 수 있다. 근본 해결은 둘 중 하나:
- Vercel 프로젝트 Production Branch 설정을 `develop`으로 바꾸는 위치를 다시 찾아서 변경, 또는
- `main`을 `develop`로 fast-forward해서 아예 `main` 자체를 최신 상태로 유지(둘 다 develop이
  main의 조상이 아니라 반대 방향이라 fast-forward 가능 — `git merge-base --is-ancestor origin/main
  origin/develop`으로 매번 확인 가능)

## 겪었던 문제 모음 (재발 시 참고)

| 증상 | 원인 | 해결 |
|---|---|---|
| Railway/Vercel 레포 검색에 안 뜸 | GitHub 조직의 GitHub App 저장소 접근 권한 미승인 | `github.com/organizations/<org>/settings/installations`에서 허용 |
| Railway 빌드 실패 — "Railpack could not determine how to build" | Root Directory 미지정(레포 루트에서 빌드 시도) | Settings > Source > Root Directory = `backend` |
| Vercel `/api/*` 요청이 404 `DNS_HOSTNAME_RESOLVED_PRIVATE` | `BACKEND_ORIGIN` 미반영 → `next.config.mjs`가 `localhost`로 폴백, Vercel이 사설 IP로 판단해 차단 | 실제로는 Production Branch가 `main`이라 `develop`의 env-var 코드 자체가 없었던 것 — 위 "Production Branch" 항목 참고 |
| Supabase 연결 `P1000: Authentication failed` | `.env`에 `[YOUR-PASSWORD]` 자리에 대괄호까지 남겨둠 | 대괄호 포함 통째로 지우고 실제 비밀번호만 남기기 |
| 로컬 `npx prisma dev` 실행 시 `node:sqlite` 관련 에러로 기동 실패 | Node 버전(v22.11 등)이 `node:sqlite` 실험 모듈과 호환 안 됨 | Node 24 LTS 이상 사용 |
| `vercel link` 실행 후 `.env.example` 파일들이 사라지고 `.gitignore`에 `.env*` 추가됨 | Vercel CLI가 자동으로 `.gitignore`에 넓은 패턴 추가 | `.env*` 대신 `.env`/`.env.local`만 개별로 무시하도록 되돌림(`.env.example`류는 시크릿이 없는 템플릿이라 계속 커밋 대상) |

## 참고

- 필요한 환경변수 전체 목록과 각 값을 어디서 발급받는지는 `backend/.env.example`,
  `frontend/.env.local.example`에 정리돼 있다 — 이 문서와 같이 유지보수할 것.
- 로컬 개발 환경(DB 포함) 실행 방법은 루트 `CLAUDE.md`의 "실행" 섹션 참고. 배포와는 별개 흐름이다.
