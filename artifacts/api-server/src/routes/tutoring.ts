import { Router } from "express";
import { db } from "@workspace/db";
import { tutoringRequestsTable, usersTable, paymentsTable } from "@workspace/db";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { parseParam } from "../lib/utils.js";
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
        .where(
          sql`${tutoringRequestsTable.teacherId} = ${userId} OR (${tutoringRequestsTable.isUrgent} = true AND ${tutoringRequestsTable.teacherId} IS NULL)`
        ).orderBy(desc(tutoringRequestsTable.createdAt));
    }
    const result = await Promise.all(requests.map(async (r) => {
      const [student] = await db.select().from(usersTable).where(eq(usersTable.id, r.studentId)).limit(1);
      const [teacher] = r.teacherId ? await db.select().from(usersTable).where(eq(usersTable.id, r.teacherId)).limit(1) : [null];
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

// Student creates a tutoring request
router.post("/requests", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const { teacherId, categoryId, lecturerLevel, isUrgent, subject, topic, preferredAt, durationMinutes, message, attachmentsUrl } = req.body;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const cost = 100;
    if (parseFloat(user.balance) < cost) {
      res.status(400).json({ error: "Insufficient balance. Minimum 100 dinars required." }); return;
    }

    const result = await db.transaction(async (tx) => {
      // Deduct balance
      await tx.update(usersTable)
        .set({ balance: sql`${usersTable.balance} - ${cost}` })
        .where(eq(usersTable.id, userId));

      // Determine rate (default to something if urgent)
      let hourlyRate = "0.00";
      if (teacherId && !isUrgent) {
        const [teacher] = await tx.select().from(usersTable).where(eq(usersTable.id, teacherId)).limit(1);
        if (teacher) hourlyRate = teacher.tutoringHourlyRate || "0.00";
      }

      // Create tutoring request
      const [request] = await tx.insert(tutoringRequestsTable).values({
        studentId: userId,
        categoryId: categoryId || null,
        lecturerLevel: lecturerLevel || null,
        teacherId: isUrgent ? null : (teacherId || null),
        isUrgent: isUrgent || false,
        subject: subject || "General",
        topic: topic || "",
        preferredAt: new Date(preferredAt),
        durationMinutes: durationMinutes || 60,
        message: message || null,
        attachmentsUrl: attachmentsUrl || null,
        hourlyRate,
        totalAmount: cost.toString(),
        status: "pending",
        currency: "LYD",
      }).returning();

      // Create pending payment
      await tx.insert(paymentsTable).values({
        userId,
        tutoringRequestId: request.id,
        amount: cost.toString(),
        method: "wallet",
        status: "pending",
        notes: "Tutoring request reservation"
      });
      
      return request;
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Teacher accepts a request
router.post("/requests/:id/accept", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const requestId = parseParam(req.params.id);

    const [request] = await db.select().from(tutoringRequestsTable).where(eq(tutoringRequestsTable.id, requestId)).limit(1);
    if (!request) { res.status(404).json({ error: "Request not found" }); return; }

    if (request.status !== "pending") {
      res.status(400).json({ error: "Request is no longer pending" }); return;
    }

    const roomId = `edulibya-tutoring-${requestId}-${crypto.randomBytes(4).toString("hex")}`;
    const meetingUrl = `https://meet.jit.si/${roomId}`;

    if (request.isUrgent && request.teacherId === null) {
      // Race condition for urgent request
      const [updated] = await db.update(tutoringRequestsTable)
        .set({ teacherId: userId, status: "accepted", meetingUrl, updatedAt: new Date() })
        .where(and(eq(tutoringRequestsTable.id, requestId), isNull(tutoringRequestsTable.teacherId), eq(tutoringRequestsTable.status, "pending")))
        .returning();
      if (!updated) { res.status(400).json({ error: "Request already taken" }); return; }
      res.json({ success: true, meetingUrl, updated });
    } else if (request.teacherId === userId) {
      const [updated] = await db.update(tutoringRequestsTable)
        .set({ status: "accepted", meetingUrl, updatedAt: new Date() })
        .where(eq(tutoringRequestsTable.id, requestId))
        .returning();
      res.json({ success: true, meetingUrl, updated });
    } else {
      res.status(403).json({ error: "Not authorized to accept this request" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Teacher declines
router.post("/requests/:id/decline", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const requestId = parseParam(req.params.id);

    const [request] = await db.select().from(tutoringRequestsTable).where(eq(tutoringRequestsTable.id, requestId)).limit(1);
    if (!request) { res.status(404).json({ error: "Request not found" }); return; }

    if (request.teacherId !== userId && !request.isUrgent) {
      res.status(403).json({ error: "Not authorized" }); return;
    }

    if (request.status !== "pending" && request.status !== "rescheduled_by_teacher") {
       res.status(400).json({ error: "Cannot decline in current status" }); return;
    }

    await db.transaction(async (tx) => {
      await tx.update(tutoringRequestsTable)
        .set({ status: "declined", updatedAt: new Date() })
        .where(eq(tutoringRequestsTable.id, requestId));
      
      // Refund student
      await tx.update(usersTable)
        .set({ balance: sql`${usersTable.balance} + ${parseFloat(request.totalAmount)}` })
        .where(eq(usersTable.id, request.studentId));

      await tx.update(paymentsTable)
        .set({ status: "refunded", updatedAt: new Date() })
        .where(eq(paymentsTable.tutoringRequestId, requestId));
    });

    res.json({ success: true, status: "declined" });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Teacher proposes a new time
router.post("/requests/:id/propose-time", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const requestId = parseParam(req.params.id);
    const { proposedAt } = req.body;
    if (!proposedAt) { res.status(400).json({ error: "proposedAt is required" }); return; }
    
    const [updated] = await db.update(tutoringRequestsTable)
      .set({ status: "rescheduled_by_teacher", proposedAt: new Date(proposedAt), updatedAt: new Date() })
      .where(and(eq(tutoringRequestsTable.id, requestId), eq(tutoringRequestsTable.teacherId, userId), eq(tutoringRequestsTable.status, "pending")))
      .returning();
    if (!updated) { res.status(404).json({ error: "Request not found, not in pending state, or unauthorized" }); return; }
    res.json({ success: true, updated });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Student accepts teacher's proposed time
router.post("/requests/:id/accept-proposed-time", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const requestId = parseParam(req.params.id);
    
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
      
    res.json({ success: true, meetingUrl, updated });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Student cancels
router.post("/requests/:id/cancel", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const requestId = parseParam(req.params.id);

    const [request] = await db.select().from(tutoringRequestsTable).where(and(eq(tutoringRequestsTable.id, requestId), eq(tutoringRequestsTable.studentId, userId))).limit(1);
    if (!request) { res.status(404).json({ error: "Request not found" }); return; }

    if (request.status === "completed" || request.status === "cancelled" || request.status === "declined") {
      res.status(400).json({ error: "Cannot cancel a completed, cancelled or declined session" }); return;
    }

    await db.transaction(async (tx) => {
      await tx.update(tutoringRequestsTable)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(tutoringRequestsTable.id, requestId));
      
      // Refund
      await tx.update(usersTable)
        .set({ balance: sql`${usersTable.balance} + ${parseFloat(request.totalAmount)}` })
        .where(eq(usersTable.id, request.studentId));

      await tx.update(paymentsTable)
        .set({ status: "refunded", updatedAt: new Date() })
        .where(eq(paymentsTable.tutoringRequestId, requestId));
    });

    res.json({ success: true, status: "cancelled" });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Student rates after session
router.post("/requests/:id/rate", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const requestId = parseParam(req.params.id);
    const { rating, review } = req.body;
    await db.update(tutoringRequestsTable)
      .set({ studentRating: rating, studentReview: review, updatedAt: new Date() })
      .where(and(eq(tutoringRequestsTable.id, requestId), eq(tutoringRequestsTable.studentId, userId)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Mark session as complete (deduct from reserve and add to teacher)
router.post("/requests/:id/complete", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const requestId = parseParam(req.params.id);

    const [request] = await db.select().from(tutoringRequestsTable).where(eq(tutoringRequestsTable.id, requestId)).limit(1);
    if (!request) { res.status(404).json({ error: "Request not found" }); return; }

    if (request.teacherId !== userId && request.studentId !== userId) {
      res.status(403).json({ error: "Not authorized" }); return;
    }

    if (request.status !== "accepted") {
      res.status(400).json({ error: "Request must be accepted before completing" }); return;
    }

    await db.transaction(async (tx) => {
      await tx.update(tutoringRequestsTable)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(tutoringRequestsTable.id, requestId));

      await tx.update(paymentsTable)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(paymentsTable.tutoringRequestId, requestId));
        
      // Transfer to teacher's balance
      if (request.teacherId) {
        await tx.update(usersTable)
          .set({ balance: sql`${usersTable.balance} + ${parseFloat(request.totalAmount)}` }) 
          .where(eq(usersTable.id, request.teacherId));
      }
    });

    res.json({ success: true, status: "completed" });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
