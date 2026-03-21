import { Router } from "express";
import { db } from "@workspace/db";
import { progressTable, enrollmentsTable, lessonsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.post("/:courseId/:lessonId", requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const lessonId = parseInt(req.params.lessonId);
    const { userId } = (req as any).user;
    const { isCompleted, watchedSeconds } = req.body;

    const existing = await db.select().from(progressTable)
      .where(and(eq(progressTable.lessonId, lessonId), eq(progressTable.userId, userId)))
      .limit(1);

    let prog;
    if (existing.length > 0) {
      [prog] = await db.update(progressTable)
        .set({ isCompleted, watchedSeconds, updatedAt: new Date() })
        .where(and(eq(progressTable.lessonId, lessonId), eq(progressTable.userId, userId)))
        .returning();
    } else {
      [prog] = await db.insert(progressTable)
        .values({ lessonId, courseId, userId, isCompleted, watchedSeconds })
        .returning();
    }

    const [completedCount] = await db.select({ value: count() }).from(progressTable)
      .where(and(eq(progressTable.courseId, courseId), eq(progressTable.userId, userId), eq(progressTable.isCompleted, true)));
    const [totalCount] = await db.select({ value: count() }).from(lessonsTable).where(eq(lessonsTable.courseId, courseId));
    const progressPct = totalCount.value > 0 ? (Number(completedCount.value) / Number(totalCount.value)) * 100 : 0;

    await db.update(enrollmentsTable)
      .set({ progress: progressPct.toFixed(2) })
      .where(and(eq(enrollmentsTable.courseId, courseId), eq(enrollmentsTable.userId, userId)));

    res.json({
      lessonId: prog.lessonId,
      courseId: prog.courseId,
      userId: prog.userId,
      isCompleted: prog.isCompleted,
      watchedSeconds: prog.watchedSeconds,
      updatedAt: prog.updatedAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
