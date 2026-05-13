import { Router } from "express";
import { db } from "@workspace/db";
import {
  liveSessionsTable, sessionRegistrationsTable, sessionQuestionsTable, usersTable
} from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import crypto from "crypto";

const router = Router();

// Get session detail + registration status + seat count
router.get("/sessions/:id", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const sessionId = parseInt(req.params.id);
    const [session] = await db.select().from(liveSessionsTable).where(eq(liveSessionsTable.id, sessionId)).limit(1);
    if (!session) { res.status(404).json({ error: "Session not found" }); return; }

    const [registeredCount] = await db.select({ total: count() }).from(sessionRegistrationsTable)
      .where(eq(sessionRegistrationsTable.sessionId, sessionId));

    const existing = await db.select().from(sessionRegistrationsTable)
      .where(and(eq(sessionRegistrationsTable.sessionId, sessionId), eq(sessionRegistrationsTable.userId, userId)))
      .limit(1);

    const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, session.teacherId)).limit(1);

    res.json({
      ...session,
      price: parseFloat(session.price),
      registeredCount: Number(registeredCount.total),
      seatsLeft: session.maxParticipants - Number(registeredCount.total),
      isFull: Number(registeredCount.total) >= session.maxParticipants,
      isRegistered: existing.length > 0 || session.teacherId === userId,
      teacherName: teacher?.fullName || "Unknown",
      isTeacher: session.teacherId === userId,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Register for a session (claim a seat)
router.post("/sessions/:id/register", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const sessionId = parseInt(req.params.id);
    const [session] = await db.select().from(liveSessionsTable).where(eq(liveSessionsTable.id, sessionId)).limit(1);
    if (!session) { res.status(404).json({ error: "Session not found" }); return; }

    const [registeredCount] = await db.select({ total: count() }).from(sessionRegistrationsTable)
      .where(eq(sessionRegistrationsTable.sessionId, sessionId));
    if (Number(registeredCount.total) >= session.maxParticipants) {
      res.status(400).json({ error: "Session is full" }); return;
    }

    const existing = await db.select().from(sessionRegistrationsTable)
      .where(and(eq(sessionRegistrationsTable.sessionId, sessionId), eq(sessionRegistrationsTable.userId, userId)))
      .limit(1);
    if (existing.length > 0) { res.json({ success: true, alreadyRegistered: true }); return; }

    await db.insert(sessionRegistrationsTable).values({ sessionId, userId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Join session — returns embedded room info (only if registered or teacher)
router.post("/sessions/:id/join", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const sessionId = parseInt(req.params.id);
    const [session] = await db.select().from(liveSessionsTable).where(eq(liveSessionsTable.id, sessionId)).limit(1);
    if (!session) { res.status(404).json({ error: "Session not found" }); return; }

    // Block joining cancelled sessions
    if (session.status === "cancelled") {
      res.status(403).json({ error: "This session has been cancelled", cancellationReason: session.cancellationReason });
      return;
    }

    const isTeacher = session.teacherId === userId;
    const existing = await db.select().from(sessionRegistrationsTable)
      .where(and(eq(sessionRegistrationsTable.sessionId, sessionId), eq(sessionRegistrationsTable.userId, userId)))
      .limit(1);

    if (!isTeacher && existing.length === 0 && parseFloat(session.price) > 0) {
      res.status(403).json({ error: "You must register for this session first" }); return;
    }

    // Auto-register if free and not registered
    if (!isTeacher && existing.length === 0) {
      const [registeredCount] = await db.select({ total: count() }).from(sessionRegistrationsTable)
        .where(eq(sessionRegistrationsTable.sessionId, sessionId));
      if (Number(registeredCount.total) >= session.maxParticipants) {
        res.status(400).json({ error: "Session is full" }); return;
      }
      await db.insert(sessionRegistrationsTable).values({ sessionId, userId, joinedAt: new Date() });
    } else if (existing.length > 0) {
      await db.update(sessionRegistrationsTable)
        .set({ joinedAt: new Date() })
        .where(and(eq(sessionRegistrationsTable.sessionId, sessionId), eq(sessionRegistrationsTable.userId, userId)));
    }

    // Generate a stable, deterministic room ID for this session.
    // This is used by the frontend Jitsi IFrame API — no external URL redirect needed.
    const roomId = `edulibya-${sessionId}-${crypto.createHash("md5").update(sessionId.toString()).digest("hex").slice(0, 8)}`;

    // Persist the room ID and mark session as live when teacher joins
    if (isTeacher && session.status !== "live") {
      await db.update(liveSessionsTable)
        .set({ meetingUrl: roomId, status: "live" })
        .where(eq(liveSessionsTable.id, sessionId));
    } else if (!session.meetingUrl) {
      await db.update(liveSessionsTable)
        .set({ meetingUrl: roomId })
        .where(eq(liveSessionsTable.id, sessionId));
    }

    res.json({ roomId, sessionId, isTeacher });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Q&A — get questions for a session
router.get("/sessions/:id/questions", requireAuth, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const questions = await db.select().from(sessionQuestionsTable)
      .where(eq(sessionQuestionsTable.sessionId, sessionId))
      .orderBy(desc(sessionQuestionsTable.upvotes));
    const result = await Promise.all(questions.map(async (q) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, q.userId)).limit(1);
      return { ...q, userName: user?.fullName || "Anonymous" };
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Q&A — submit question
router.post("/sessions/:id/questions", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const sessionId = parseInt(req.params.id);
    const { question } = req.body;
    const [q] = await db.insert(sessionQuestionsTable).values({ sessionId, userId, question }).returning();
    res.status(201).json(q);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Q&A — upvote question
router.post("/sessions/:id/questions/:qId/upvote", requireAuth, async (req, res) => {
  try {
    const qId = parseInt(req.params.qId);
    const [q] = await db.select().from(sessionQuestionsTable).where(eq(sessionQuestionsTable.id, qId)).limit(1);
    if (!q) { res.status(404).json({ error: "Question not found" }); return; }
    await db.update(sessionQuestionsTable).set({ upvotes: q.upvotes + 1 }).where(eq(sessionQuestionsTable.id, qId));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Q&A — mark answered (teacher only)
router.post("/sessions/:id/questions/:qId/answer", requireAuth, async (req, res) => {
  try {
    await db.update(sessionQuestionsTable).set({ answered: true }).where(eq(sessionQuestionsTable.id, parseInt(req.params.qId)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
