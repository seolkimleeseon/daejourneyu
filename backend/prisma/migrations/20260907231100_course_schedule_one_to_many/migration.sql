-- DropIndex
DROP INDEX "CourseSchedule_courseId_key";

-- CreateIndex
CREATE INDEX "CourseSchedule_courseId_idx" ON "CourseSchedule"("courseId");
