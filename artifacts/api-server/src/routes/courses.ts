import { Router } from "express";
import { db } from "@workspace/db";
import {
  coursesTable,
  usersTable,
  categoriesTable,
  lessonsTable,
  enrollmentsTable,
  reviewsTable,
  progressTable,
} from "@workspace/db";
import { eq, and, ilike, count, avg, sum, sql, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

function buildCourseResult(course: any, teacher: any, reviewData: any, enrollCount: number, lessonData: any) {
  return {
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
    enrollmentCount: enrollCount,
    lessonCount: Number(lessonData?.lessonCount || 0),
    totalDuration: Number(lessonData?.totalDuration || 0),
    isPublished: course.isPublished,
    createdAt: course.createdAt,
  };
}

router.get("/", async (req, res) => {
  try {
    const { categoryId, search, level, language, teacherId, page = "1", limit = "12" } = req.query as any;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.isPublished, true))
      .$dynamic();

    const conditions: any[] = [eq(coursesTable.isPublished, true)];
    if (categoryId) conditions.push(eq(coursesTable.categoryId, parseInt(categoryId)));
    if (level) conditions.push(eq(coursesTable.level, level));
    if (language) conditions.push(eq(coursesTable.language, language));
    if (teacherId) conditions.push(eq(coursesTable.teacherId, parseInt(teacherId)));
    if (search) conditions.push(ilike(coursesTable.title, `%${search}%`));

    const allCourses = await db
      .select()
      .from(coursesTable)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .limit(limitNum)
      .offset(offset);

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(coursesTable)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0]);

    const courses = await Promise.all(
      allCourses.map(async (course) => {
        const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, course.teacherId)).limit(1);
        const [reviewData] = await db
          .select({ avgRating: avg(reviewsTable.rating), reviewCount: count() })
          .from(reviewsTable)
          .where(eq(reviewsTable.courseId, course.id));
        const [enrollData] = await db
          .select({ value: count() })
          .from(enrollmentsTable)
          .where(eq(enrollmentsTable.courseId, course.id));
        const [lessonData] = await db
          .select({ lessonCount: count(), totalDuration: sum(lessonsTable.duration) })
          .from(lessonsTable)
          .where(eq(lessonsTable.courseId, course.id));

        return buildCourseResult(course, teacher, reviewData, Number(enrollData.value), lessonData);
      })
    );

    res.json({
      courses,
      total: Number(total),
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(Number(total) / limitNum),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const { title, titleAr, description, descriptionAr, thumbnailUrl, price, level, language, categoryId, isPublished } = req.body;
    const [course] = await db.insert(coursesTable).values({
      title, titleAr, description, descriptionAr, thumbnailUrl,
      price: price.toString(),
      level, language, categoryId,
      isPublished: isPublished || false,
      teacherId: userId,
    }).returning();
    const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    res.status(201).json(buildCourseResult(course, teacher, { avgRating: "0", reviewCount: 0 }, 0, { lessonCount: 0, totalDuration: 0 }));
  } catch (err: any) {
    res.status(400).json({ error: "Failed to create course", message: err.message });
  }
});

router.get("/:courseId", async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }

    const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, course.teacherId)).limit(1);
    const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, course.categoryId)).limit(1);
    const [reviewData] = await db
      .select({ avgRating: avg(reviewsTable.rating), reviewCount: count() })
      .from(reviewsTable)
      .where(eq(reviewsTable.courseId, courseId));
    const [enrollData] = await db.select({ value: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, courseId));
    const [lessonData] = await db
      .select({ lessonCount: count(), totalDuration: sum(lessonsTable.duration) })
      .from(lessonsTable)
      .where(eq(lessonsTable.courseId, courseId));
    const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, courseId)).orderBy(lessonsTable.order);

    let isEnrolled = false;
    let userProgress = null;
    const token = req.headers.authorization?.slice(7);
    if (token) {
      try {
        const { verifyToken } = await import("../lib/auth.js");
        const payload = verifyToken(token);
        const [enrollment] = await db
          .select()
          .from(enrollmentsTable)
          .where(and(eq(enrollmentsTable.courseId, courseId), eq(enrollmentsTable.userId, payload.userId)))
          .limit(1);
        if (enrollment) {
          isEnrolled = true;
          userProgress = parseFloat(enrollment.progress);
        }
      } catch {}
    }

    const teacherCourseCount = await db.select({ value: count() }).from(coursesTable).where(eq(coursesTable.teacherId, teacher.id));
    const teacherStudentCount = await db.select({ value: count() }).from(enrollmentsTable)
      .where(sql`${enrollmentsTable.courseId} IN (SELECT id FROM courses WHERE teacher_id = ${teacher.id})`);
    const teacherRating = await db.select({ avgRating: avg(reviewsTable.rating) }).from(reviewsTable)
      .where(sql`${reviewsTable.courseId} IN (SELECT id FROM courses WHERE teacher_id = ${teacher.id})`);

    res.json({
      ...buildCourseResult(course, teacher, reviewData, Number(enrollData.value), lessonData),
      lessons: lessons.map(l => ({
        id: l.id,
        title: l.title,
        titleAr: l.titleAr,
        duration: l.duration,
        order: l.order,
        isFree: l.isFree,
        type: l.type,
      })),
      category: {
        id: category?.id,
        name: category?.name,
        nameAr: category?.nameAr,
        icon: category?.icon,
        courseCount: 0,
      },
      teacher: {
        id: teacher.id,
        fullName: teacher.fullName,
        fullNameAr: teacher.fullNameAr || teacher.fullName,
        avatarUrl: teacher.avatarUrl,
        bio: teacher.bio,
        bioAr: teacher.bioAr,
        courseCount: Number(teacherCourseCount[0].value),
        studentCount: Number(teacherStudentCount[0].value),
        rating: parseFloat(teacherRating[0]?.avgRating || "0"),
        expertise: teacher.expertise,
      },
      isEnrolled,
      userProgress,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.put("/:courseId", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const { userId, role } = (req as any).user;
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }
    if (course.teacherId !== userId && role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

    const { title, titleAr, description, descriptionAr, thumbnailUrl, price, level, language, categoryId, isPublished } = req.body;
    const [updated] = await db.update(coursesTable)
      .set({ title, titleAr, description, descriptionAr, thumbnailUrl, price: price?.toString(), level, language, categoryId, isPublished, updatedAt: new Date() })
      .where(eq(coursesTable.id, courseId))
      .returning();

    const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, updated.teacherId)).limit(1);
    const [reviewData] = await db.select({ avgRating: avg(reviewsTable.rating), reviewCount: count() }).from(reviewsTable).where(eq(reviewsTable.courseId, courseId));
    const [enrollData] = await db.select({ value: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, courseId));
    const [lessonData] = await db.select({ lessonCount: count(), totalDuration: sum(lessonsTable.duration) }).from(lessonsTable).where(eq(lessonsTable.courseId, courseId));

    res.json(buildCourseResult(updated, teacher, reviewData, Number(enrollData.value), lessonData));
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.delete("/:courseId", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const { userId, role } = (req as any).user;
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }
    if (course.teacherId !== userId && role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

    // Block deletion if students are enrolled
    const [{ value: enrollCount }] = await db.select({ value: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, courseId));
    if (Number(enrollCount) > 0) {
      res.status(403).json({ error: "Cannot delete a course with enrolled students. Remove all enrollments first." });
      return;
    }

    await db.delete(coursesTable).where(eq(coursesTable.id, courseId));
    res.json({ success: true, message: "Course deleted" });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.get("/:courseId/lessons", async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, courseId)).orderBy(lessonsTable.order);
    res.json(lessons.map(l => ({
      id: l.id,
      title: l.title,
      titleAr: l.titleAr,
      duration: l.duration,
      order: l.order,
      isFree: l.isFree,
      type: l.type,
      courseId: l.courseId,
      videoUrl: l.videoUrl,
      content: l.content,
      contentAr: l.contentAr,
      createdAt: l.createdAt,
    })));
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/:courseId/lessons", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const { title, titleAr, videoUrl, videoFilePath, documentFilePath, documentFileName, content, contentAr, duration, order, isFree, type, bookName, bookNameAr, schoolYear, chapter, pageNumber, subjectTags } = req.body;
    const [lesson] = await db.insert(lessonsTable).values({
      courseId, title, titleAr, videoUrl, videoFilePath, documentFilePath, documentFileName, content, contentAr,
      duration: duration || 0,
      order: order || 0,
      isFree: isFree || false,
      type: type || "video",
      bookName: bookName || null, bookNameAr: bookNameAr || null, schoolYear: schoolYear || null,
      chapter: chapter || null, pageNumber: pageNumber || null, subjectTags: subjectTags || null
    }).returning();
    res.status(201).json({ ...lesson, courseId: lesson.courseId });
  } catch (err: any) {
    res.status(400).json({ error: "Failed to create lesson", message: err.message });
  }
});

router.get("/:courseId/lessons/:lessonId", requireAuth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { userId } = (req as any).user;
    const [lesson] = await db.select().from(lessonsTable)
      .where(and(eq(lessonsTable.id, parseInt(lessonId)), eq(lessonsTable.courseId, parseInt(courseId))))
      .limit(1);
    if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }

    if (!lesson.isFree) {
      const [enrollment] = await db.select().from(enrollmentsTable)
        .where(and(eq(enrollmentsTable.courseId, parseInt(courseId)), eq(enrollmentsTable.userId, userId)))
        .limit(1);
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, parseInt(courseId))).limit(1);
      if (!enrollment && course?.teacherId !== userId) {
        res.status(403).json({ error: "Not enrolled in this course" });
        return;
      }
    }

    const [prog] = await db.select().from(progressTable)
      .where(and(eq(progressTable.lessonId, parseInt(lessonId)), eq(progressTable.userId, userId)))
      .limit(1);

    res.json({
      id: lesson.id,
      title: lesson.title,
      titleAr: lesson.titleAr,
      duration: lesson.duration,
      order: lesson.order,
      isFree: lesson.isFree,
      type: lesson.type,
      courseId: lesson.courseId,
      videoUrl: lesson.videoUrl,
      content: lesson.content,
      contentAr: lesson.contentAr,
      createdAt: lesson.createdAt,
      isCompleted: prog?.isCompleted || false,
      watchedSeconds: prog?.watchedSeconds || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.put("/:courseId/lessons/:lessonId", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, titleAr, videoUrl, videoFilePath, documentFilePath, documentFileName, content, contentAr, duration, order, isFree, bookName, bookNameAr, schoolYear, chapter, pageNumber, subjectTags } = req.body;
    const [updated] = await db.update(lessonsTable)
      .set({ 
        title, titleAr, videoUrl, videoFilePath, documentFilePath, documentFileName, content, contentAr, duration, order, isFree, updatedAt: new Date(),
        bookName: bookName || null, bookNameAr: bookNameAr || null, schoolYear: schoolYear || null,
        chapter: chapter || null, pageNumber: pageNumber || null, subjectTags: subjectTags || null
      })
      .where(eq(lessonsTable.id, parseInt(lessonId)))
      .returning();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.delete("/:courseId/lessons/:lessonId", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { lessonId } = req.params;
    await db.delete(lessonsTable).where(eq(lessonsTable.id, parseInt(lessonId)));
    res.json({ success: true, message: "Lesson deleted" });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/:courseId/enroll", requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const { userId } = (req as any).user;
    const existing = await db.select().from(enrollmentsTable)
      .where(and(eq(enrollmentsTable.courseId, courseId), eq(enrollmentsTable.userId, userId)))
      .limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Already enrolled" });
      return;
    }
    const [enrollment] = await db.insert(enrollmentsTable).values({ courseId, userId, progress: "0" }).returning();
    res.status(201).json({
      id: enrollment.id,
      courseId: enrollment.courseId,
      userId: enrollment.userId,
      progress: parseFloat(enrollment.progress),
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.get("/:courseId/reviews", async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.courseId, courseId)).orderBy(reviewsTable.createdAt);
    const result = await Promise.all(
      reviews.map(async (r) => {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId)).limit(1);
        return {
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          user: {
            id: r.userId,
            fullName: user?.fullName || "Unknown",
            fullNameAr: user?.fullNameAr || user?.fullName || "Unknown",
            avatarUrl: user?.avatarUrl || null,
          }
        };
      })
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/:courseId/reviews", requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const { userId } = (req as any).user;
    const { rating, comment } = req.body;
    const [review] = await db.insert(reviewsTable).values({ courseId, userId, rating, comment }).returning();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    res.status(201).json({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: {
        id: review.userId,
        fullName: user?.fullName || "Unknown",
        fullNameAr: user?.fullNameAr || user?.fullName || "Unknown",
        avatarUrl: user?.avatarUrl || null,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
