import { Router } from "express";
import { db } from "@workspace/db";
import { enrollmentsTable, coursesTable, usersTable, reviewsTable, lessonsTable } from "@workspace/db";
import { eq, avg, count, sum } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.userId, userId));
    const result = await Promise.all(
      enrollments.map(async (e) => {
        const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, e.courseId)).limit(1);
        const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, course.teacherId)).limit(1);
        const [reviewData] = await db.select({ avgRating: avg(reviewsTable.rating), reviewCount: count() }).from(reviewsTable).where(eq(reviewsTable.courseId, course.id));
        const [enrollData] = await db.select({ value: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, course.id));
        const [lessonData] = await db.select({ lessonCount: count(), totalDuration: sum(lessonsTable.duration) }).from(lessonsTable).where(eq(lessonsTable.courseId, course.id));
        return {
          id: e.id,
          courseId: e.courseId,
          userId: e.userId,
          progress: parseFloat(e.progress),
          enrolledAt: e.enrolledAt,
          completedAt: e.completedAt,
          course: {
            id: course.id,
            title: course.title,
            titleAr: course.titleAr,
            description: course.description,
            descriptionAr: course.descriptionAr,
            thumbnailUrl: course.thumbnailUrl,
            price: parseFloat(course.price),
            currency: course.currency,
            level: course.level,
            language: course.language,
            categoryId: course.categoryId,
            teacherId: course.teacherId,
            teacherName: teacher?.fullName || "",
            teacherAvatar: teacher?.avatarUrl || null,
            rating: parseFloat(reviewData?.avgRating || "0"),
            reviewCount: Number(reviewData?.reviewCount || 0),
            enrollmentCount: Number(enrollData?.value || 0),
            lessonCount: Number(lessonData?.lessonCount || 0),
            totalDuration: Number(lessonData?.totalDuration || 0),
            isPublished: course.isPublished,
            createdAt: course.createdAt,
          },
        };
      })
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
