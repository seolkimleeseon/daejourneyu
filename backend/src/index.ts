import "dotenv/config";
import express from "express";
import cors from "cors";
import placesRouter from "./routes/places";
import weatherRouter from "./routes/weather";
import petTourSpotsRouter from "./routes/petTourSpots";
import daejeonRouter from "./routes/daejeon";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:3000" })); // Next.js 개발 서버 허용
app.use(express.json());

// 헬스체크
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// 라우트
app.use("/api/places", placesRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/pet-tour-spots", petTourSpotsRouter);
app.use("/api/daejeon", daejeonRouter);

app.listen(PORT, () => {
  console.log(`🐾 대저니유 API listening on http://localhost:${PORT}`);
});
