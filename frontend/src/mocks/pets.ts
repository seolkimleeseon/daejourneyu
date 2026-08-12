import type { Pet } from "@/types";

export const mockPets: Pet[] = [
  {
    id: "pet-1",
    name: "콩이",
    breed: "골든리트리버",
    weightKg: 28,
    ageYears: 3,
    size: "대형견",
    emoji: "🐕",
    mbti: {
      code: "ENFP",
      name: "여기저기 뛰어다니는 모험견",
      theme: "산책",
      traits: ["사교적", "새로움", "즉흥적"],
    },
  },
  {
    id: "pet-2",
    name: "모찌",
    breed: "포메라니안",
    weightKg: 3,
    ageYears: 2,
    size: "소형견",
    emoji: "🐩",
  },
];
