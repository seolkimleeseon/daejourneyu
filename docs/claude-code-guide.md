# Claude Code 사용 정리

개인 학습 노트를 주제별로 재구성한 문서.

---

## 1. 설정 파일 체계

### 1.1 로딩 순서와 우선순위

```
시스템 프롬프트 → CLAUDE.md → 사용자 입력 프롬프트
```

CLAUDE.md는 나중에 로드된 것이 우선한다. (하위 디렉토리 > 프로젝트 루트 > 전역)

| 파일 | 위치 | 역할 | Git |
| --- | --- | --- | --- |
| 전역 CLAUDE.md | `~/.claude/CLAUDE.md` | 개인 코딩 선호도, 개인 숏컷 | 제외 |
| 프로젝트 CLAUDE.md | `{루트}/CLAUDE.md` | 기술 스택, 구조, 팀 코딩 표준 | 커밋 |
| 하위 CLAUDE.md | `{하위디렉토리}/CLAUDE.md` | 해당 영역 추가 규칙 (문서/테스트 등) | 커밋 |
| 규칙 파일 | `.claude/rules/*.md` | 주제별 모듈화된 규칙 | 커밋 |
| 스킬 | `.claude/skills/*/SKILL.md` | 반복 업무 실행 가이드 | 커밋 |
| 팀 설정 | `.claude/settings.json` | 도구 권한 등 팀 공통 설정 | 커밋 |
| 개인 설정 | `.claude/settings.local.json` | 개인 API 키, 로컬 MCP | 제외 |
| MCP 설정 | `.mcp.json` | 팀 공통 MCP 환경 | 커밋 |
| Auto Memory | `~/.claude/projects/<project>/memory/` | Claude가 자동 기록 | 자동 |

> 비유: CLAUDE.md가 **기본법**, `.claude/rules/*.md`가 **시행령**.

### 1.2 CLAUDE.md vs Auto Memory

| 구분 | CLAUDE.md | Auto Memory |
| --- | --- | --- |
| 작성자 | 개발자가 직접 | Claude가 자동 기록 |
| 로드 범위 | 세션 시작 시 전체 | 처음 200줄만 |
| 확인 방법 | 파일 직접 열기 | `/memory` |

Auto Memory는 주기적으로 `/memory`로 열어 잘못되거나 오래된 내용을 정리한다.

### 1.3 SKILL.md 운영

- 특정 작업을 반복 수행할 때 쓰는 실행 가이드
- `skills/` 하위에 업무 단위로 폴더 + `SKILL.md` 생성
- 업무 단위로 분리 (CLAUDE.md는 프로젝트당 1개, SKILL은 여러 개)

---

## 2. CLI 명령어

| 명령 | 설명 |
| --- | --- |
| `claude` | 대화형 세션 시작 |
| `claude "질문"` | 질문과 함께 대화형 시작 |
| `claude -p "질문"` | 1회성 응답 후 종료 (스크립트용) |
| `claude -c` / `--continue` | 이 폴더의 가장 최근 대화 이어서 |
| `claude -r` / `--resume` | 세션 목록에서 선택해서 이어서 |
| `claude -r "ses_id" "질문"` | 세션 ID 지정해 비대화형으로 이어가기 |
| `claude sessions list` | 저장된 세션 목록 |
| `claude sessions delete <ID>` | 오래된 세션 삭제 (디스크 확보) |
| `claude doctor` | 설치·설정 진단 |
| `claude update` | 수동 업데이트 |
| `claude --permission-mode plan` | 플랜 모드로 시작 |
| `claude /allowed-tools` | 화이트리스트 설정 |
| `claude --dangerously-skip-permissions` | 권한 확인 생략 (완전 자동화) |

> `--dangerously-skip-permissions`는 dev container 등 **격리된 환경**에서만 사용 권장.

### 2.1 주요 플래그

**기본 실행**

| 플래그 | 약어 | 설명 |
| --- | --- | --- |
| `--print` | `-p` | 비대화형 실행 후 종료 |
| `--model` | `-m` | 사용할 모델 지정 |
| `--resume` | | 이전 세션 선택 재개 |
| `--continue` | | 마지막 세션 자동 재개 |
| `--language` | | 응답 언어 지정 (`--language ko`) |

**동작 제어**

| 플래그 | 설명 |
| --- | --- |
| `--max-turns 10` | 에이전트 루프 최대 턴 수 제한 |
| `--system-prompt "..."` | 커스텀 시스템 프롬프트 (세션 전체 유지) |
| `--allowedTools Read,Grep` | 사전 승인 도구 지정 |
| `--output-format json` | 출력 형식 지정 |

> `--max-turns`를 너무 낮게 잡으면 작업이 중간에 끊긴다. 기본값으로 시작하고 필요한 시나리오에서만 조정.

### 2.2 출력 형식

| 형식 | 설명 | 용도 |
| --- | --- | --- |
| (기본값) | Markdown 렌더링 | 사람이 읽는 대화형 |
| `text` | 순수 텍스트 | 텍스트 파이프라인 |
| `json` | 구조화 JSON | 스크립트·자동화 |
| `stream-json` | 스트리밍 JSON | 실시간 파이프라인 |

```bash
claude -p "현재 디렉토리의 파일 개수를 알려줘" --output-format json
```

### 2.3 입력 방식

- **멀티라인**: 대화형은 `Shift+Enter`, 비대화형은 셸 히어독
- **파이프**: `cat error.log | claude -p "이 에러 로그를 분석하고 원인과 해결 방법을 알려줘"`
- **이미지**: 대화형에서 `@파일명` (여러 개는 공백 구분). 컨텍스트 토큰을 많이 먹으므로 필요할 때만, 가급적 낮은 해상도로.

---

## 3. 슬래시 커맨드

| 커맨드 | 설명 |
| --- | --- |
| `/help` | 사용 가능한 명령 목록 |
| `/init` | `CLAUDE.md` 자동 생성 및 프로젝트 셋업 |
| `/clear` | 대화 맥락 비우기 |
| `/compact` | 대화 요약 압축 (토큰 절약) |
| `/memory` | 메모리·규칙 파일 보기/편집 |
| `/model` | 모델 전환 (Opus / Sonnet / Haiku) |
| `/permissions` | 도구 허용 목록 관리 |
| `/status` | 인증·모델·세션 상태 및 컨텍스트 사용량 |
| `/resume` | 다른 세션으로 전환 |
| `/doctor` | 세션 내 진단 |
| `/review` | PR 코드리뷰 요청 |
| `/pr_comments` | 열린/닫힌 PR 내용을 컨텍스트로 가져옴 |
| `/teleport` | 세션을 웹 브라우저 UI로 전환 |

---

## 4. 키보드 단축키 & 작업 모드

| 키 | 동작 |
| --- | --- |
| `Shift + Tab` | 권한 모드 순환 (Normal → Auto Accept → Plan) |
| `Ctrl + C` | 현재 작업 취소 |
| `Ctrl + D` | 세션 종료 |
| `Ctrl + O` | verbose 토글 (내부 추론 표시) |
| `ESC` | 이전 채팅 목록 표시 → 선택해 되돌리기 |
| `@` | 파일·폴더 참조 자동완성 |
| `/` | 슬래시 커맨드·스킬 목록 |
| `?` | 전체 단축키 보기 |

**작업 모드 3가지**

- **일반(Normal)**: 기본. 각 작업마다 승인 필요
- **자동 수락(Auto Accept)**: 제안 작업 전부 자동 수락
- **계획(Plan)**: 실행 전 계획을 설명하고 승인 대기 — 큰 변경 전에 사용하면 토큰 절약

> ESC로 이전 상태로 되돌리면 **이후 기록은 삭제**된다 (미래로 되돌아갈 수 없음).

---

## 5. 세션 · 컨텍스트 관리

### 5.1 컨텍스트 윈도우

한 번에 참조 가능한 최대 범위 (시스템 프롬프트 + CLAUDE.md + 대화 이력 + 도구 결과 + 스킬).

- `/status`로 사용량 확인
- **80% 이상 차면 성능 저하** 가능
- 새 주제/대규모 리팩터링 시작 시 `/clear`로 정리 → 토큰 효율 상승
- 이전 내용을 이어야 하면 `/clear` 대신 `/compact`
- 중요한 규칙은 CLAUDE.md에 기록해 초기화 후에도 유지되게 할 것

### 5.2 대화가 길어질 때 (핸드오프 패턴)

1. `/compact summarize and create xxx_history.md` 로 요약 md 생성
2. 새 세션을 열고:
   `Based on the information in @xxx_history.md, please analyze the current status of our conversation and identify the key topics, decisions, and unresolved issues.`
3. 커스텀 프롬프트로 요약 md 갱신·저장

### 5.3 세션 재개 방법 비교

| 방법 | 명령 | 적합한 상황 |
| --- | --- | --- |
| 선택 재개 | `claude --resume` | 여러 프로젝트 병행 |
| 마지막 재개 | `claude --continue` | 하루 종일 같은 작업 |
| ID 직접 재개 | `claude --resume <ID>` | 세션 ID를 아는 경우 |
| 웹 전환 | `/teleport` | 시각적 출력이 많은 경우 |

> 세션 재개 시 이전 컨텍스트가 **완벽히 복원되지는 않는다.**

### 5.4 Git 커밋 활용

변경사항이 생길 때마다 커밋하도록 요청하면 버전 간 이동이 자유롭다.

```
Please commit these changes with a descriptive message before proceeding
```

---

## 6. CLAUDE.md 작성 가이드

### 6.1 나쁜 패턴

- **긴 파일** — 파일당 200줄 이하 (500~2000단어) 유지
- **모호한 지시** — "깔끔하게", "잘" 같은 표현
- **코드 스타일 규칙 나열** — 린터/포매터가 훨씬 빠르고 정확하다. 린터가 할 일을 LLM에게 시키지 말 것
- **IMPORTANT 남발** — 진짜 중요한 1~2개에만 써야 효과가 있다

### 6.2 좋은 패턴

**검증 가능한 규칙**

```
IMPORTANT: 기능 추가 후 반드시 `npm test`를 실행하세요.
모든 테스트가 통과되지 않으면 코드 변경을 완료된 것으로 간주하지 마세요.
실패 시 수정 후 재실행하세요.
```

**도메인 용어 정의** — 프로젝트에서만 쓰이는 특별한 의미의 단어는 반드시 정의한다.

> "주문 금액을 계산해줘" → **주문**: 고객이 한 번에 결제하는 묶음 전체

**Claude가 추측할 수 없는 맥락**에 집중 — 프로젝트 고유의 규칙, 아키텍처 결정, 자주 하는 실수.

**모듈식 관리** — 규칙이 많아지면 `.claude/rules/`로 분리. 관련 파일 작업 시에만 로드된다.

**빈 파일로 시작** — 처음부터 완벽한 CLAUDE.md는 없다. 실수할 때마다 한 줄씩 추가.

### 6.3 권장 기본 구조

```markdown
# 프로젝트명

프로젝트에 대한 한두 줄 설명.

## 기술 스택
- 런타임/언어 및 버전, 프레임워크, DB, 주요 라이브러리

## 프로젝트 구조
디렉토리 트리와 각 디렉토리의 역할.

## 코딩 규칙
네이밍, 스타일, 금지 패턴.

## 자주 사용하는 명령어
개발 서버, 테스트, 빌드.

## 주의사항
자주 하는 실수, 알려진 이슈, 특별한 고려사항.
```

### 6.4 작성 예시 (Node.js + TypeScript)

```markdown
# 온라인 쇼핑몰 API

Node.js와 Express를 사용한 RESTful API 서버입니다.

## 기술 스택
- Node.js 20.x (LTS) / TypeScript 5.x (strict)
- Express 4.18.x / PostgreSQL 15 + Prisma ORM / Jest 29.x

## 프로젝트 구조
src/
├── routes/       # API 라우트 정의
├── controllers/  # 비즈니스 로직
├── services/     # 외부 서비스 연동
├── models/       # Prisma 스키마와 타입
├── middleware/   # 인증, 로깅 등
└── utils/        # 공통 유틸리티
tests/            # Jest 테스트

## 코딩 규칙
### 네이밍
- 파일명: kebab-case (user-service.ts)
- 클래스/인터페이스: PascalCase (UserService)
- 함수/변수: camelCase (getUser)
- 상수: UPPER_SNAKE_CASE (MAX_RETRY)

### TypeScript
- any 사용 금지 (unknown 또는 명시적 타입)
- 모든 공개 함수에 JSDoc 필수
- 비동기는 반드시 async/await

### 에러 처리
- 모든 비동기 작업은 try-catch
- 사용자 메시지와 개발자 메시지 분리

## 자주 사용하는 명령어
개발 서버: npm run dev / 테스트: npm test
빌드: npm run build / DB 마이그레이션: npm run db:migrate

## 주의사항
- API 키는 .env에 저장 (하드코딩 금지)
- 새 패키지 추가 전 팀 리뷰 필요
- 테스트 없이 PR 승인 불가
```

핵심: 명명 규칙을 **예시와 함께** 구체적으로, **금지 패턴**을 명시, **보안 지시사항**은 주의사항에 반드시 포함.

### 6.5 전역 CLAUDE.md 예시

```markdown
# 전역 개인 설정

## 개인 선호 사항
- 코드 주석은 한국어로 작성
- 커밋 메시지는 Conventional Commits 형식 (feat:, fix:, docs:)
- 테스트 코드는 Given-When-Then 패턴
- 긴 함수는 반드시 분리 (단일 책임 원칙)
```

---

## 7. 팀 협업 전략

- **Boris Cherny 방식**: 팀원 누구든 Claude의 실수를 발견하면 CLAUDE.md에 한 줄 추가하고 PR을 올린다. 코드 리뷰 때 이 변경도 함께 검토 → 머지되면 팀 전원이 같은 실수를 방지.
- `.claude/settings.json`에 자주 쓰는 안전한 명령어를 미리 승인해 두면 확인 창이 반복해서 뜨지 않는다.
- `.mcp.json`을 커밋해두면 팀원 모두 같은 환경에서 작업.
- 주기적으로 Claude에게 리뷰를 맡긴다: *"우리 CLAUDE.md 한번 리뷰해줘. 불필요한 내용이나 빠진 게 있으면 알려줘."*

### `/init` 후 검토 체크리스트

- [ ] 프로젝트의 목적과 비즈니스 로직을 추가했는가
- [ ] 팀 코딩 규칙과 스타일 가이드를 명시했는가
- [ ] 중요한 아키텍처 결정 사항을 기록했는가
- [ ] 자주 하는 실수와 주의사항을 추가했는가
- [ ] 보안 관련 지시사항을 포함했는가 (API 키 관리 등)

---

## 8. 실전 팁

- `@`로 파일·폴더를 명시해 **영향 범위(scope)를 제한**한다
- 큰 변경 전에는 Plan Mode로 (토큰 절약)
- 반복되는 맥락은 CLAUDE.md에 넣어둔다
- 복잡한 추론이 필요할 때만 `--model`로 상위 모델 전환 (비용·속도 절약)
- 문제가 생기면 `/doctor`

### 모델 선택 예시

```bash
# 복잡한 리팩터링: 상위 모델
claude -m <opus-model-id> -p "전체 아키텍처를 SOLID 원칙에 맞게 리팩터링해줘"

# 일상적인 코딩: 기본값
claude -p "이 함수에 단위 테스트를 추가해줘"
```

> 모델 ID는 버전마다 바뀐다. 정확한 ID를 외우기보다 `/model`로 전환하는 편이 안전하다.

### 시스템 프롬프트 커스터마이징

```bash
claude --system-prompt "당신은 보안 전문가입니다. 모든 코드를 OWASP 기준으로 검토하십시오."
```

---

## 9. 최종 체크리스트

- [ ] CLAUDE.md 200줄 이하 유지
- [ ] 모호한 지시 대신 스스로 검증 가능한 구체적 규칙
- [ ] `IMPORTANT`는 1~2개에만 사용
- [ ] 프로젝트 고유 도메인 용어 정의
- [ ] 규칙이 많아지면 `.claude/rules/`로 모듈화
- [ ] Git에 커밋해 팀 공유
- [ ] 빈 파일로 시작, 실수할 때마다 한 줄씩 추가
- [ ] `/memory`로 Auto Memory 주기적 확인·정리
- [ ] 코드 스타일은 린터/포매터에게
- [ ] 전체 메모리 파일 합계 10,000 토큰 미만 유지
