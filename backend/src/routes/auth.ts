import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
} from "../lib/auth";

const router = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MIN_NICKNAME_LENGTH = 2;

/** 클라이언트로 내보내는 사용자 정보. passwordHash는 절대 포함하지 않는다. */
interface PublicUser {
  id: string;
  /** 카카오 계정은 이메일 동의를 안 받았을 수 있어 null이 올 수 있다. */
  email: string | null;
  nickname: string;
  provider: string;
}

function toPublicUser(user: {
  id: string;
  email: string | null;
  nickname: string;
  provider: string;
}): PublicUser {
  return { id: user.id, email: user.email, nickname: user.nickname, provider: user.provider };
}

/** 프론트 폼과 같은 규칙으로 검증한다 — 클라이언트 검증은 우회될 수 있으므로 서버에서 다시 본다. */
function validateCredentials(body: unknown, options: { requireNickname: boolean }) {
  const { email, nickname, password } = (body ?? {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};

  if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
    errors.email = "이메일 형식을 확인해주세요";
  }
  if (
    options.requireNickname &&
    (typeof nickname !== "string" || nickname.trim().length < MIN_NICKNAME_LENGTH)
  ) {
    errors.nickname = "닉네임은 2자 이상 입력해주세요";
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    errors.password = "비밀번호는 8자 이상 입력해주세요";
  }

  return {
    errors,
    email: typeof email === "string" ? email.trim().toLowerCase() : "",
    nickname: typeof nickname === "string" ? nickname.trim() : "",
    password: typeof password === "string" ? password : "",
  };
}

// POST /api/auth/signup
router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { errors, email, nickname, password } = validateCredentials(req.body, {
      requireNickname: true,
    });
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ errors: { email: "이미 가입된 이메일이에요" } });
    }

    const user = await prisma.user.create({
      data: { email, nickname, passwordHash: await hashPassword(password) },
    });

    setAuthCookie(res, signAccessToken({ userId: user.id }));
    res.status(201).json({ user: toPublicUser(user) });
  })
);

// POST /api/auth/login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { errors, email, password } = validateCredentials(req.body, { requireNickname: false });
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    const user = await prisma.user.findUnique({ where: { email } });
    // 이메일이 없는 경우와 비밀번호가 틀린 경우를 구분해 알려주지 않는다(계정 존재 여부 노출 방지).
    // 카카오로 가입한 계정은 passwordHash가 없어 비밀번호 로그인이 불가능하다.
    if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다" });
    }

    setAuthCookie(res, signAccessToken({ userId: user.id }));
    res.json({ user: toPublicUser(user) });
  })
);

// GET /api/auth/me — 새로고침 후 세션 복구용
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(401).json({ error: "인증이 필요합니다" });

    res.json({ user: toPublicUser(user) });
  })
);

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

export default router;
