import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signAuthToken } from "../lib/auth";
import { requireAuth } from "../middleware/requireAuth";

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

export default router;
