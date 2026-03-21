import { Router } from "express";
import { db } from "@workspace/db";
import { tutoringRequestsTable, usersTable, paymentsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import crypto from "crypto";

const router = Router();

// List tutors (teachers with tutoring enabled)
router.get("/tutors", async (_req, res) => {
  try {
    const tutors = await db.select().from(usersTable)
      .where(and(eq(usersTable.role, "teacher"), eq(usersTable.isTutoringEnabled, true)));
    res.json(tutors.map(t => ({
      id: t.id,
      fullName: t.fullName,
      bio: t.bio,
      expertise: t.expertise,
      avatarUrl: t.avatarUrl,
      tutoringHourlyRate: parseFloat(t.tutoringHourlyRate || "0"),
      tutoringSubjects: t.tutoringSubjects,
      isVerified: t.isVerified,
    })));
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Update teacher tutoring settings
router.put("/settings", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const { isTutoringEnabled, tutoringHourlyRate, tutoringSubjects } = req.body;
    const [updated] = await db.update(usersTable)
      .set({ isTutoringEnabled, tutoringHourlyRate: tutoringHourlyRate?.toString(), tutoringSubjects, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();
    res.json({ success: true, isTutoringEnabled: updated.isTutoringEnabled });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Student creates a tutoring request
router.post("/requests", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const { teacherId, subject, topic, preferredAt, durationMinutes, message, hourlyRate } = req.body;
    const totalAmount = (parseFloat(hourlyRate) * (durationMinutes / 60)).toFixed(2);
    const [request] = await db.insert(tutoringRequestsTable).values({
      studentId: userId,
      teacherId,
      subject, topic, message,
      preferredAt: new Date(preferredAt),
      durationMinutes: durationMinutes || 60,
      hourlyRate: hourlyRate.toString(),
      totalAmount,
      currency: "LYD",
    }).returning();
    res.status(201).json(request);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Get my tutoring requests (student or teacher)
router.get("/requests", requireAuth, async (req, res) => {
  try {
    const { userId, role } = (req as any).user;
    let requests;
    if (role === "student") {
      requests = await db.select().from(tutoringRequestsTable)
        .where(eq(tutoringRequestsTable.studentId, userId)).orderBy(desc(tutoringRequestsTable.createdAt));
    } else {
      requests = await db.select().from(tutoringRequestsTable)
        .where(eq(tutoringRequestsTable.teacherId, userId)).orderBy(desc(tutoringRequestsTable.createdAt));
    }
    const result = await Promise.all(requests.map(async (r) => {
      const [student] = await db.select().from(usersTable).where(eq(usersTable.id, r.studentId)).limit(1);
      const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, r.teacherId)).limit(1);
      return {
        ...r,
        hourlyRate: parseFloat(r.hourlyRate),
        totalAmount: parseFloat(r.totalAmount),
        studentName: student?.fullName,
        studentEmail: student?.email,
        teacherName: teacher?.fullName,
        teacherEmail: teacher?.email,
      };
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Teacher accepts a request → generates meeting link
router.post("/requests/:id/accept", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const requestId = parseInt(req.params.id);
    const roomId = `edulibya-tutoring-${requestId}-${crypto.randomBytes(4).toString("hex")}`;
    const meetingUrl = `https://meet.jit.si/${roomId}`;
    const [updated] = await db.update(tutoringRequestsTable)
      .set({ status: "accepted", meetingUrl, updatedAt: new Date() })
      .where(and(eq(tutoringRequestsTable.id, requestId), eq(tutoringRequestsTable.teacherId, userId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Request not found" }); return; }
    res.json({ success: true, meetingUrl });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Teacher declines
router.post("/requests/:id/decline", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const requestId = parseInt(req.params.id);
    await db.update(tutoringRequestsTable)
      .set({ status: "declined", updatedAt: new Date() })
      .where(and(eq(tutoringRequestsTable.id, requestId), eq(tutoringRequestsTable.teacherId, userId)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Student rates after session
router.post("/requests/:id/rate", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const requestId = parseInt(req.params.id);
    const { rating, review } = req.body;
    await db.update(tutoringRequestsTable)
      .set({ studentRating: rating, studentReview: review, status: "completed", updatedAt: new Date() })
      .where(and(eq(tutoringRequestsTable.id, requestId), eq(tutoringRequestsTable.studentId, userId)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Teacher proposes a new time
router.post("/requests/:id/propose-time", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const requestId = parseInt(req.params.id);
    const { proposedAt } = req.body;
    if (!proposedAt) { res.status(400).json({ error: "proposedAt is required" }); return; }
    
    const [updated] = await db.update(tutoringRequestsTable)
      .set({ status: "rescheduled_by_teacher", proposedAt: new Date(proposedAt), updatedAt: new Date() })
      .where(and(eq(tutoringRequestsTable.id, requestId), eq(tutoringRequestsTable.teacherId, userId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Request not found or unauthorized" }); return; }
    res.json({ success: true, updated });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Student accepts teacher's proposed time
router.post("/requests/:id/accept-proposed-time", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const requestId = parseInt(req.params.id);
    
    const [request] = await db.select().from(tutoringRequestsTable).where(and(eq(tutoringRequestsTable.id, requestId), eq(tutoringRequestsTable.studentId, userId)));
    if (!request || request.status !== "rescheduled_by_teacher" || !request.proposedAt) {
       res.status(400).json({ error: "Invalid request to accept proposed time" });
       return;
    }

    const roomId = `edulibya-tutoring-${requestId}-${crypto.randomBytes(4).toString("hex")}`;
    const meetingUrl = `https://meet.jit.si/${roomId}`;
    
    const [updated] = await db.update(tutoringRequestsTable)
      .set({ 
         status: "accepted", 
         preferredAt: request.proposedAt,
         proposedAt: null,
         meetingUrl, 
         updatedAt: new Date() 
      })
      .where(eq(tutoringRequestsTable.id, requestId))
      .returning();
      
    res.json({ success: true, meetingUrl });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Student cancels or declines
router.post("/requests/:id/cancel", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const requestId = parseInt(req.params.id);
    await db.update(tutoringRequestsTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(tutoringRequestsTable.id, requestId), eq(tutoringRequestsTable.studentId, userId)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
