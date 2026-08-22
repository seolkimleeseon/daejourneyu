-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "nickname" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "nights" INTEGER NOT NULL,
    "transport" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayIndex" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,
    CONSTRAINT "CourseDay_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseStop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order" INTEGER NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "petFriendly" BOOLEAN NOT NULL,
    "courseDayId" TEXT NOT NULL,
    CONSTRAINT "CourseStop_courseDayId_fkey" FOREIGN KEY ("courseDayId") REFERENCES "CourseDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    CONSTRAINT "CourseSchedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseScheduleFestival" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "courseScheduleId" TEXT NOT NULL,
    CONSTRAINT "CourseScheduleFestival_courseScheduleId_fkey" FOREIGN KEY ("courseScheduleId") REFERENCES "CourseSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CourseDay_courseId_dayIndex_key" ON "CourseDay"("courseId", "dayIndex");

-- CreateIndex
CREATE UNIQUE INDEX "CourseStop_courseDayId_order_key" ON "CourseStop"("courseDayId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSchedule_courseId_key" ON "CourseSchedule"("courseId");
