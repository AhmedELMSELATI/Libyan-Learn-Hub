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
    cancellationReason: session.cancellationReason,
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
    const { userId } = (req as any).user;
    const sessionId = parseInt(req.params.sessionId);
    const [session] = await db.select().from(liveSessionsTable).where(eq(liveSessionsTable.id, sessionId)).limit(1);
    
    if (!session) { res.status(404).json({ error: "Session not found" }); return; }

    if (session.status === "cancelled") {
      res.status(403).json({ error: "This session has been cancelled", cancellationReason: session.cancellationReason });
      return;
    }

    const isTeacher = session.teacherId === userId;
    // Return stable internal roomId
    const roomId = session.meetingUrl || `edulibya-legacy-${sessionId}`;
    
    res.json({
      sessionId: session.id,
      roomId: roomId,
      isTeacher,
      message: "Success",
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/:sessionId/cancel", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { userId, role } = (req as any).user;
    const { reason, notifyStudents } = req.body;
    
    const [session] = await db.select().from(liveSessionsTable).where(eq(liveSessionsTable.id, parseInt(req.params.sessionId))).limit(1);
    
    if (!session) { 
      res.status(404).json({ error: "Session not found" }); 
      return; 
    }
    
    if (session.teacherId !== userId && role !== "admin") {
      res.status(403).json({ error: "Forbidden: You are not the teacher of this session" });
      return;
    }

    const [updatedSession] = await db.update(liveSessionsTable)
      .set({ 
        status: "cancelled", 
        cancellationReason: reason || null 
      })
      .where(eq(liveSessionsTable.id, parseInt(req.params.sessionId)))
      .returning();

    if (notifyStudents) {
      // Simulate sending notifications
      console.log(`Notification: Live Session ${session.id} cancelled. Reason: ${reason || 'No reason provided'}`);
    }

    res.json({
      success: true,
      message: "Session cancelled successfully",
      session: await formatSession(updatedSession)
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
