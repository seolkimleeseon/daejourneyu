import "dotenv/config";
import { defineConfig } from "prisma/config";

/** Prisma CLI 설정. 접속 URL은 schema.prisma의 env("DATABASE_URL")을 정본으로 둔다. */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
