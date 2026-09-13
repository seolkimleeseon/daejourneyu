-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT,
    "nights" INTEGER NOT NULL,
    "transport" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseDay" (
    "id" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,
    CONSTRAINT "CourseDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseStop" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "petFriendly" BOOLEAN NOT NULL,
    "imageUrl" TEXT,
    "courseDayId" TEXT NOT NULL,
    CONSTRAINT "CourseStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSchedule" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    CONSTRAINT "CourseSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseScheduleFestival" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "courseScheduleId" TEXT NOT NULL,
    CONSTRAINT "CourseScheduleFestival_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "petFriendly" BOOLEAN NOT NULL,
    "smallDogOnly" BOOLEAN NOT NULL DEFAULT false,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "source" TEXT NOT NULL,
    "sourceTier" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseDay_courseId_dayIndex_key" ON "CourseDay"("courseId", "dayIndex");
CREATE UNIQUE INDEX "CourseStop_courseDayId_order_key" ON "CourseStop"("courseDayId", "order");
CREATE UNIQUE INDEX "CourseSchedule_courseId_key" ON "CourseSchedule"("courseId");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseDay" ADD CONSTRAINT "CourseDay_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseStop" ADD CONSTRAINT "CourseStop_courseDayId_fkey" FOREIGN KEY ("courseDayId") REFERENCES "CourseDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseSchedule" ADD CONSTRAINT "CourseSchedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseScheduleFestival" ADD CONSTRAINT "CourseScheduleFestival_courseScheduleId_fkey" FOREIGN KEY ("courseScheduleId") REFERENCES "CourseSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
