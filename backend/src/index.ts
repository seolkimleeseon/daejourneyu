import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import placesRouter from "./routes/places";
import weatherRouter from "./routes/weather";
import petTourSpotsRouter from "./routes/petTourSpots";
import daejeonRouter from "./routes/daejeon";
import parksRouter from "./routes/parks";
import geocodeRouter from "./routes/geocode";
import kakaoPlacesRouter from "./routes/kakaoPlaces";
import petFacilitiesRouter from "./routes/petFacilities";
import verifiedPetRestaurantsRouter from "./routes/verifiedPetRestaurants";
import daejeonPlacesRouter from "./routes/daejeonPlaces";
import campgroundsRouter from "./routes/campgrounds";
import coursesRouter from "./routes/courses";
import aiRouter from "./routes/ai";
import authRouter from "./routes/auth";
import petsRouter from "./routes/pets";
import authKakaoRouter from "./routes/authKakao";
import postsRouter from "./routes/posts";
import reviewsRouter from "./routes/reviews";
import festivalsRouter from "./routes/festivals";

const app = express();
const PORT = process.env.PORT || 4000;

// credentials: 인증 쿠키를 주고받기 위해 필요(프론트가 rewrites로 프록시하지 않고 직접 호출하는 경우 대비)
// FRONTEND_ORIGIN 미설정 시(로컬 개발) localhost:3000을 허용한다.
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000", credentials: true }));
// 후기 사진을 data URL(base64)로 그대로 보내므로 기본 100kb로는 부족하다.
// 프론트 MAX_PHOTO_BYTES(2MB) 원본이 base64로 부풀면(~4/3) 최대 약 2.7MB라 여유를 두고 잡는다.
app.use(express.json({ limit: "4mb" }));
app.use(cookieParser());

// 헬스체크
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// 라우트
app.use("/api/places", placesRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/pet-tour-spots", petTourSpotsRouter);
app.use("/api/daejeon", daejeonRouter);
app.use("/api/parks", parksRouter);
app.use("/api/geocode", geocodeRouter);
app.use("/api/kakao-places", kakaoPlacesRouter);
app.use("/api/pet-facilities", petFacilitiesRouter);
app.use("/api/verified-pet-restaurants", verifiedPetRestaurantsRouter);
app.use("/api/daejeon-places", daejeonPlacesRouter);
app.use("/api/campgrounds", campgroundsRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/auth", authRouter);
app.use("/api/auth/kakao", authKakaoRouter);
app.use("/api/pets", petsRouter);
app.use("/api/posts", postsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/festivals", festivalsRouter);

// 라우터에서 넘어온 예외를 500으로 변환한다 — 스택은 서버 로그에만 남긴다.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // express.json()이 limit 초과 시 던지는 PayloadTooLargeError. 그냥 두면 아래 500으로
  // 뭉개져서 프론트가 "사진이 너무 크다"는 걸 알 방법이 없어진다.
  if (err && typeof err === "object" && (err as { status?: number }).status === 413) {
    return res.status(413).json({ error: "요청 용량이 너무 커요. 사진 크기를 줄여주세요" });
  }
  console.error("[api] 처리 중 오류:", err);
  res.status(500).json({ error: "서버에서 문제가 발생했어요. 잠시 후 다시 시도해주세요" });
});

app.listen(PORT, () => {
  console.log(`🐾 대저니유 API listening on http://localhost:${PORT}`);
});
