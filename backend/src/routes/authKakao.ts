import { randomBytes } from "crypto";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { setAuthCookie, signAccessToken } from "../lib/auth";
import { buildAuthorizeUrl, fetchKakaoProfileByCode } from "../lib/kakao";

const router = Router();

/** CSRF 방지용 state를 담는 쿠키. 인가 요청과 콜백이 같은 브라우저인지 확인하는 용도라 수명이 짧다. */
const STATE_COOKIE = "daejourneyu_kakao_state";
const STATE_TTL_MS = 5 * 60 * 1000;

function frontendOrigin(): string {
  return process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";
}

/** 열린 리다이렉트를 막기 위해 앱 내부 경로(/로 시작, //가 아닌)만 허용한다. */
function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return "/home";
  return next;
}

// GET /api/auth/kakao/start?next=/my — 카카오 동의 화면으로 보낸다
router.get("/start", (req, res) => {
  const state = randomBytes(16).toString("hex");
  const next = safeNextPath(req.query.next);

  res.cookie(STATE_COOKIE, `${state}:${next}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STATE_TTL_MS,
  });

  res.redirect(buildAuthorizeUrl(state));
});

// GET /api/auth/kakao/callback?code=...&state=... — 카카오가 되돌려 보내는 지점
router.get(
  "/callback",
  asyncHandler(async (req, res) => {
    const stored = req.cookies?.[STATE_COOKIE] as string | undefined;
    res.clearCookie(STATE_COOKIE, { path: "/" });

    const [storedState, storedNext] = (stored ?? "").split(":");
    const next = safeNextPath(storedNext);

    const failureRedirect = (reason: string) =>
      res.redirect(`${frontendOrigin()}/onboarding/login?error=${reason}`);

    // state가 없거나 다르면 우리가 시작한 로그인이 아니다.
    if (!storedState || storedState !== req.query.state) return failureRedirect("kakao_state");
    if (typeof req.query.code !== "string") return failureRedirect("kakao_denied");

    // 토큰 교환·프로필 조회는 외부 호출이라 실패할 수 있다. 그때도 JSON 500이 아니라
    // 사용자가 볼 수 있는 로그인 화면으로 돌려보낸다.
    let user;
    try {
      const profile = await fetchKakaoProfileByCode(req.query.code);

      // 카카오 회원번호가 계정의 기준이다. 닉네임·이메일은 바뀔 수 있어 식별자로 쓰지 않는다.
      user = await prisma.user.upsert({
        where: { provider_providerId: { provider: "kakao", providerId: profile.id } },
        update: { nickname: profile.nickname },
        create: {
          provider: "kakao",
          providerId: profile.id,
          nickname: profile.nickname,
          email: profile.email,
        },
      });
    } catch (error) {
      console.error("[auth] 카카오 로그인 실패:", error);
      return failureRedirect("kakao_failed");
    }

    setAuthCookie(res, signAccessToken({ userId: user.id }));
    res.redirect(`${frontendOrigin()}${next}`);
  })
);

export default router;
