import { PrismaClient } from "@prisma/client";

// tsx watch로 파일이 바뀔 때마다 재시작되며 PrismaClient가 중복 생성되지 않도록
// 전역에 캐시해 둔다(개발 모드 전용 패턴).
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
