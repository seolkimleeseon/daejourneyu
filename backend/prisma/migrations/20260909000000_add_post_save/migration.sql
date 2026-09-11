-- CreateTable
CREATE TABLE "PostSave" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "courseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostSave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostSave_postId_idx" ON "PostSave"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostSave_userId_postId_key" ON "PostSave"("userId", "postId");

-- AddForeignKey
ALTER TABLE "PostSave" ADD CONSTRAINT "PostSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostSave" ADD CONSTRAINT "PostSave_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostSave" ADD CONSTRAINT "PostSave_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

