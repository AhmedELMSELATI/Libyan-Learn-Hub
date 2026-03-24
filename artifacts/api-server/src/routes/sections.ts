import { Router } from "express";
import { db } from "@workspace/db";
import {
  sectionsTable,
  lessonsTable,
  slidesTable,
  quizzesTable,
  enrollmentsTable,
} from "@workspace/db";
import { eq, and, asc, count } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const sections = await db
      .select()
      .from(sectionsTable)
      .where(eq(sectionsTable.courseId, courseId))
      .orderBy(asc(sectionsTable.order));

    const sectionsWithLessons = await Promise.all(
      sections.map(async (section) => {
        const lessons = await db
          .select()
          .from(lessonsTable)
          .where(
            and(
              eq(lessonsTable.courseId, courseId),
              eq(lessonsTable.sectionId, section.id)
            )
          )
          .orderBy(asc(lessonsTable.order));

        const lessonIds = lessons.map((l) => l.id);
        const quiz = lessonIds.length
          ? await db
              .select()
              .from(quizzesTable)
              .where(
                and(
                  eq(quizzesTable.courseId, courseId),
                  eq(quizzesTable.type, "lesson")
                )
              )
              .limit(1)
          : [];

        return {
          ...section,
          lessons: lessons.map((l) => ({
            id: l.id,
            title: l.title,
            titleAr: l.titleAr,
            duration: l.duration,
            order: l.order,
            isFree: l.isFree,
            type: l.type,
          })),
          lessonCount: lessons.length,
        };
      })
    );

    res.json(sectionsWithLessons);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const { title, titleAr, description, descriptionAr, order } = req.body;
    const [section] = await db
      .insert(sectionsTable)
      .values({ courseId, title, titleAr, description, descriptionAr, order: order || 0 })
      .returning();
    res.status(201).json(section);
  } catch (err: any) {
    res.status(400).json({ error: "Failed to create section", message: err.message });
  }
});

router.put("/:sectionId", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const sectionId = parseInt(req.params.sectionId);
    const { title, titleAr, description, descriptionAr, order } = req.body;
    const [updated] = await db
      .update(sectionsTable)
      .set({ title, titleAr, description, descriptionAr, order, updatedAt: new Date() })
      .where(eq(sectionsTable.id, sectionId))
      .returning();
    if (!updated) { res.status(404).json({ error: "Section not found" }); return; }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: "Failed to update section", message: err.message });
  }
});

router.delete("/:sectionId", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const sectionId = parseInt(req.params.sectionId);

    // Block deletion if students are enrolled in the parent course
    const [{ value: enrollCount }] = await db.select({ value: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, courseId));
    if (Number(enrollCount) > 0) {
      res.status(403).json({ error: "Cannot delete a section from a course with enrolled students." });
      return;
    }

    // Cascade-delete lessons within this section
    await db.delete(lessonsTable).where(and(eq(lessonsTable.courseId, courseId), eq(lessonsTable.sectionId, sectionId)));
    await db.delete(sectionsTable).where(eq(sectionsTable.id, sectionId));
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: "Failed to delete section", message: err.message });
  }
});

router.get("/:sectionId/lessons", async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const sectionId = parseInt(req.params.sectionId);
    const lessons = await db
      .select()
      .from(lessonsTable)
      .where(
        and(
          eq(lessonsTable.courseId, courseId),
          eq(lessonsTable.sectionId, sectionId)
        )
      )
      .orderBy(asc(lessonsTable.order));

    const lessonsWithSlides = await Promise.all(
      lessons.map(async (lesson) => {
        const slides = await db
          .select()
          .from(slidesTable)
          .where(eq(slidesTable.lessonId, lesson.id))
          .orderBy(asc(slidesTable.order));

        const quiz = await db
          .select()
          .from(quizzesTable)
          .where(
            and(
              eq(quizzesTable.lessonId, lesson.id),
              eq(quizzesTable.type, "lesson")
            )
          )
          .limit(1);

        return {
          ...lesson,
          slides,
          hasQuiz: quiz.length > 0,
          quizId: quiz[0]?.id || null,
        };
      })
    );

    res.json(lessonsWithSlides);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/:sectionId/lessons", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const sectionId = parseInt(req.params.sectionId);
    const { title, titleAr, videoUrl, videoFilePath, documentFilePath, documentFileName, content, contentAr, notes, notesAr, duration, order, isFree, type } = req.body;
    const [lesson] = await db
      .insert(lessonsTable)
      .values({ courseId, sectionId, title, titleAr, videoUrl, videoFilePath, documentFilePath, documentFileName, content, contentAr, notes, notesAr, duration: duration || 0, order: order || 0, isFree: isFree || false, type: type || "video" })
      .returning();
    res.status(201).json(lesson);
  } catch (err: any) {
    res.status(400).json({ error: "Failed to create lesson", message: err.message });
  }
});

export default router;
