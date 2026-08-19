import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import placesRouter from "./routes/places";
import authRouter from "./routes/auth";
import petsRouter from "./routes/pets";
import authKakaoRouter from "./routes/authKakao";

const app = express();
const PORT = process.env.PORT || 4000;

// credentials: 인증 쿠키를 주고받기 위해 필요(프론트가 rewrites로 프록시하지 않고 직접 호출하는 경우 대비)
app.use(cors({ origin: "http://localhost:3000", credentials: true })); // Next.js 개발 서버 허용
app.use(express.json());
app.use(cookieParser());

// 헬스체크
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// 라우트
app.use("/api/places", placesRouter);
app.use("/api/auth", authRouter);
app.use("/api/auth/kakao", authKakaoRouter);
app.use("/api/pets", petsRouter);

// 라우터에서 넘어온 예외를 500으로 변환한다 — 스택은 서버 로그에만 남긴다.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[api] 처리 중 오류:", err);
  res.status(500).json({ error: "서버에서 문제가 발생했어요. 잠시 후 다시 시도해주세요" });
});

app.listen(PORT, () => {
  console.log(`🐾 대저니유 API listening on http://localhost:${PORT}`);
});
