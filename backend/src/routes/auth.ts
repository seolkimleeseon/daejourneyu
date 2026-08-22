import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signAuthToken } from "../lib/auth";
import { requireAuth } from "../middleware/requireAuth";
import { exchangeKakaoCode, fetchKakaoProfile, kakaoAuthorizeUrl } from "../lib/kakao";

// 카카오 로그인 콜백이 끝나고 토큰을 들고 돌아갈 프론트 주소. CORS origin과 마찬가지로 로컬 개발
// 기준 하드코딩 — 배포 시 환경변수로 뺄 것(backend/CLAUDE.md에 이미 같은 이슈가 기록돼 있음).
const FRONTEND_URL = "http://localhost:3000";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

type SignupBody = { email: string; password: string; nickname: string };
type LoginBody = { email: string; password: string };

function validateSignup(body: unknown): body is SignupBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.email !== "string" || !EMAIL_RE.test(b.email)) return false;
  if (typeof b.password !== "string" || b.password.length < MIN_PASSWORD_LENGTH) return false;
  if (typeof b.nickname !== "string" || b.nickname.trim().length === 0) return false;
  return true;
}

function validateLogin(body: unknown): body is LoginBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return typeof b.email === "string" && typeof b.password === "string";
}

function toPublicUser(user: { id: string; email: string; nickname: string }) {
  return { id: user.id, email: user.email, nickname: user.nickname };
}

const router = Router();

// POST /api/auth/signup — 이메일/비밀번호 회원가입. 성공 시 바로 로그인 상태로 토큰을 내려준다.
router.post("/signup", async (req, res) => {
  if (!validateSignup(req.body)) {
    return res.status(400).json({ error: "이메일 형식과 8자 이상 비밀번호, 닉네임을 확인해주세요" });
  }
  const { email, password, nickname } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "이미 가입된 이메일이에요" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, nickname: nickname.trim() },
  });

  const token = signAuthToken(user.id);
  res.status(201).json({ token, user: toPublicUser(user) });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  if (!validateLogin(req.body)) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력해주세요" });
  }
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  // 이메일이 없거나 비밀번호가 틀려도 같은 메시지 — 어느 쪽이 틀렸는지 노출하지 않는다.
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않아요" });
  }
  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않아요" });
  }

  const token = signAuthToken(user.id);
  res.json({ token, user: toPublicUser(user) });
});

// GET /api/auth/me — 저장된 토큰이 여전히 유효한지 확인하고 최신 사용자 정보를 돌려준다(새로고침 후 세션 복원용).
router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(401).json({ error: "사용자를 찾을 수 없어요" });
  res.json({ user: toPublicUser(user) });
});

// GET /api/auth/kakao/start?returnTo=/schedule — 카카오 인가 화면으로 리다이렉트한다.
// returnTo는 카카오의 state 파라미터에 실어 보내 콜백에서 그대로 돌려받는다.
router.get("/kakao/start", (req, res) => {
  const returnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : undefined;
  res.redirect(kakaoAuthorizeUrl(returnTo));
});

// GET /api/auth/kakao/callback — 카카오가 동의 후 ?code=로 돌아오는 지점.
// 토큰 교환 → 프로필 조회 → 계정 연결/생성 → 우리 JWT 발급 → 프론트 완료 페이지로 리다이렉트.
router.get("/kakao/callback", async (req, res) => {
  const { code, error, state } = req.query;
  // state는 "/"로 시작하는 상대 경로일 때만 신뢰한다("//evil.com" 같은 프로토콜 상대 경로로
  // 외부 사이트로 리다이렉트되는 오픈 리다이렉트를 막기 위함).
  const returnTo =
    typeof state === "string" && state.startsWith("/") && !state.startsWith("//") ? state : "/schedule";

  if (error || typeof code !== "string") {
    return res.redirect(
      `${FRONTEND_URL}/auth/kakao/complete?error=${encodeURIComponent("카카오 로그인이 취소됐어요")}&returnTo=${encodeURIComponent(returnTo)}`
    );
  }

  try {
    const accessToken = await exchangeKakaoCode(code);
    const profile = await fetchKakaoProfile(accessToken);

    let user = await prisma.user.findUnique({ where: { kakaoId: profile.kakaoId } });

    if (!user && profile.email) {
      // 이메일/비밀번호로 이미 가입한 계정과 이메일이 같으면 같은 사람으로 보고 카카오 로그인을 연결한다.
      const existingByEmail = await prisma.user.findUnique({ where: { email: profile.email } });
      if (existingByEmail && !existingByEmail.kakaoId) {
        user = await prisma.user.update({ where: { id: existingByEmail.id }, data: { kakaoId: profile.kakaoId } });
      }
    }

    if (!user) {
      // 이메일 동의를 안 받았거나 새 사람이면 새 계정을 만든다. email은 unique+필수라 없으면 합성값을 쓴다.
      const email = profile.email ?? `kakao-${profile.kakaoId}@users.daejourneyu.local`;
      user = await prisma.user.create({
        data: { email, nickname: profile.nickname, kakaoId: profile.kakaoId },
      });
    }

    const token = signAuthToken(user.id);
    res.redirect(
      `${FRONTEND_URL}/auth/kakao/complete?token=${encodeURIComponent(token)}&returnTo=${encodeURIComponent(returnTo)}`
    );
  } catch (err) {
    console.error("카카오 로그인 오류:", err);
    res.redirect(
      `${FRONTEND_URL}/auth/kakao/complete?error=${encodeURIComponent("카카오 로그인에 실패했어요. 다시 시도해주세요")}&returnTo=${encodeURIComponent(returnTo)}`
    );
  }
});

export default router;
