-- CreateTable
CREATE TABLE "pets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "ageYears" INTEGER NOT NULL,
    "size" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "mbtiCode" TEXT,
    "mbtiName" TEXT,
    "mbtiTheme" TEXT,
    "mbtiTraits" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "pets_userId_idx" ON "pets"("userId");
-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
