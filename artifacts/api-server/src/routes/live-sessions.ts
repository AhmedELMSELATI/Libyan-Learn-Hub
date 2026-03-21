import { Router } from "express";
import { db } from "@workspace/db";
import { liveSessionsTable, usersTable, enrollmentsTable } from "@workspace/db";
import { eq, gte, count } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

async function formatSession(session: any) {
  const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, session.teacherId)).limit(1);
  return {
    id: session.id,
    courseId: session.courseId,
    teacherId: session.teacherId,
    teacherName: teacher?.fullName || "",
    title: session.title,
    titleAr: session.titleAr,
    description: session.description,
    scheduledAt: session.scheduledAt,
    durationMinutes: session.durationMinutes,
    maxParticipants: session.maxParticipants,
    meetingUrl: session.meetingUrl,
    status: session.status,
    price: parseFloat(session.price || "0"),
    participantCount: 0,
    createdAt: session.createdAt,
  };
}

router.get("/", async (req, res) => {
  try {
    const { courseId, upcoming } = req.query as any;
    let sessions = await db.select().from(liveSessionsTable);
    if (courseId) sessions = sessions.filter(s => s.courseId === parseInt(courseId));
    if (upcoming === "true") sessions = sessions.filter(s => new Date(s.scheduledAt) >= new Date());
    const result = await Promise.all(sessions.map(formatSession));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const { courseId, title, titleAr, description, scheduledAt, durationMinutes, maxParticipants, meetingUrl, price = 0 } = req.body;
    const [session] = await db.insert(liveSessionsTable).values({
      courseId, teacherId: userId, title, titleAr, description,
      scheduledAt: new Date(scheduledAt),
      durationMinutes, maxParticipants, meetingUrl,
      price: parseFloat(price).toFixed(2),
    }).returning();
    res.status(201).json(await formatSession(session));
  } catch (err: any) {
    res.status(400).json({ error: "Failed to create session", message: err.message });
  }
});

router.get("/:sessionId", async (req, res) => {
  try {
    const [session] = await db.select().from(liveSessionsTable).where(eq(liveSessionsTable.id, parseInt(req.params.sessionId))).limit(1);
    if (!session) { res.status(404).json({ error: "Session not found" }); return; }
    res.json(await formatSession(session));
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/:sessionId/join", requireAuth, async (req, res) => {
  try {
    const [session] = await db.select().from(liveSessionsTable).where(eq(liveSessionsTable.id, parseInt(req.params.sessionId))).limit(1);
    if (!session) { res.status(404).json({ error: "Session not found" }); return; }
    res.json({
      sessionId: session.id,
      meetingUrl: session.meetingUrl || `https://meet.jit.si/lms-libya-${session.id}`,
      accessToken: null,
      message: "Join the session using the provided link",
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
