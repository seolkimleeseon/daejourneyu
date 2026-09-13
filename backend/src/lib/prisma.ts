import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient 싱글턴. tsx watch가 파일을 저장할 때마다 모듈을 다시 평가하므로
 * 전역에 캐시해두지 않으면 커넥션이 계속 쌓인다.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
