-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[],
    "authorName" TEXT NOT NULL,
    "authorEmoji" TEXT NOT NULL,
    "petTypeName" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostStop" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "petFriendly" BOOLEAN NOT NULL,
    "imageUrl" TEXT,
    "postId" TEXT NOT NULL,

    CONSTRAINT "PostStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Post_userId_idx" ON "Post"("userId");

-- CreateIndex
CREATE INDEX "Post_courseId_idx" ON "Post"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "PostStop_postId_order_key" ON "PostStop"("postId", "order");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostStop" ADD CONSTRAINT "PostStop_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

