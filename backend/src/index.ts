import "dotenv/config";
import express from "express";
import cors from "cors";
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
app.use("/api/parks", parksRouter);
app.use("/api/geocode", geocodeRouter);
app.use("/api/kakao-places", kakaoPlacesRouter);
app.use("/api/pet-facilities", petFacilitiesRouter);
app.use("/api/verified-pet-restaurants", verifiedPetRestaurantsRouter);
app.use("/api/daejeon-places", daejeonPlacesRouter);
app.use("/api/campgrounds", campgroundsRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/ai", aiRouter);

app.listen(PORT, () => {
  console.log(`🐾 대저니유 API listening on http://localhost:${PORT}`);
});
