import { randomBytes } from "crypto";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { setAuthCookie, signAccessToken } from "../lib/auth";
import {
  KakaoApiError,
  KakaoConfigError,
  buildAuthorizeUrl,
  fetchKakaoProfileByCode,
} from "../lib/kakao";

const router = Router();

/** CSRF 방지용 state를 담는 쿠키. 인가 요청과 콜백이 같은 브라우저인지 확인하는 용도라 수명이 짧다. */
const STATE_COOKIE = "daejourneyu_kakao_state";
const STATE_TTL_MS = 5 * 60 * 1000;

function frontendOrigin(): string {
  return process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";
}

/** next를 지정받지 않았을 때의 목적지. 콜백에서 "지정 없음"을 가려내는 기준으로도 쓴다. */
const DEFAULT_NEXT = "/home";

/** 열린 리다이렉트를 막기 위해 앱 내부 경로(/로 시작, //가 아닌)만 허용한다. */
function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return DEFAULT_NEXT;
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

  // .env가 비어 있으면 여기서 던진다. 사용자에게 JSON 500을 보여줄 이유가 없으니 로그인 화면으로 돌린다.
  let authorizeUrl: string;
  try {
    authorizeUrl = buildAuthorizeUrl(state);
  } catch (error) {
    console.error("[auth] 카카오 인가 URL 생성 실패:", error);
    return res.redirect(`${frontendOrigin()}/onboarding/login?error=kakao_config`);
  }

  res.redirect(authorizeUrl);
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

    // 실패 지점을 뭉뚱그리면 화면에는 늘 같은 문구가 떠서 원인을 못 가린다. 카카오 쪽 실패와
    // 우리 DB 쪽 실패를 나눠서 서로 다른 error 코드로 돌려보낸다.
    let profile;
    try {
      profile = await fetchKakaoProfileByCode(req.query.code);
    } catch (error) {
      console.error("[auth] 카카오 프로필 조회 실패:", error);
      if (error instanceof KakaoConfigError) return failureRedirect("kakao_config");
      if (error instanceof KakaoApiError) return failureRedirect("kakao_api");
      return failureRedirect("kakao_failed");
    }

    // 카카오 회원번호가 계정의 기준이다. 닉네임·이메일은 바뀔 수 있어 식별자로 쓰지 않는다.
    // upsert 대신 조회 후 분기하는 이유는 "이번이 첫 가입인지"를 알아야 하기 때문이다 —
    // 신규 가입자는 이메일 가입과 똑같이 반려동물 등록 화면으로 이어줘야 한다.
    let user;
    let isNewUser = false;
    try {
      const existing = await prisma.user.findUnique({
        where: { provider_providerId: { provider: "kakao", providerId: profile.id } },
      });

      user = existing
        ? await prisma.user.update({
            where: { id: existing.id },
            data: { nickname: profile.nickname },
          })
        : await prisma.user.create({
            data: {
              provider: "kakao",
              providerId: profile.id,
              nickname: profile.nickname,
              email: profile.email,
            },
          });
      isNewUser = !existing;
    } catch (error) {
      // 로컬에서 가장 흔한 원인은 prisma dev Postgres가 꺼진 것이다(README·CLAUDE.md 실행 절 참고).
      console.error("[auth] 로그인 사용자 저장 실패 — DB가 떠 있는지 확인하세요:", error);
      return failureRedirect("kakao_db");
    }

    setAuthCookie(res, signAccessToken({ userId: user.id }));

    // 갈 곳을 지정받지 않은 신규 가입자만 등록 화면으로 보낸다. 로그인 게이팅에 걸려
    // next를 달고 온 경우에는 원래 보려던 화면이 우선이다(회원가입 폼과 같은 규칙).
    const destination = isNewUser && next === DEFAULT_NEXT ? "/onboarding/pet-register" : next;
    res.redirect(`${frontendOrigin()}${destination}`);
  })
);

export default router;
