import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, coursesTable, paymentsTable, enrollmentsTable,
  teacherEarningsTable, liveSessionsTable, categoriesTable, lessonsTable
} from "@workspace/db";
import { eq, count, sql, sum, desc, and, ne } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";
import bcrypt from "bcryptjs";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

// ─── STATS ────────────────────────────────────────────────────────────────────

router.get("/stats", async (_req, res) => {
  try {
    const [userCount] = await db.select({ total: count() }).from(usersTable);
    const [teacherCount] = await db.select({ total: count() }).from(usersTable).where(eq(usersTable.role, "teacher"));
    const [studentCount] = await db.select({ total: count() }).from(usersTable).where(eq(usersTable.role, "student"));
    const [courseCount] = await db.select({ total: count() }).from(coursesTable);
    const [publishedCount] = await db.select({ total: count() }).from(coursesTable).where(eq(coursesTable.isPublished, true));
    const [enrollCount] = await db.select({ total: count() }).from(enrollmentsTable);
    const [sessionCount] = await db.select({ total: count() }).from(liveSessionsTable);

    const [revenueData] = await db.select({
      totalRevenue: sql`COALESCE(SUM(CAST(${paymentsTable.amount} AS NUMERIC)), 0)`,
    }).from(paymentsTable).where(eq(paymentsTable.status, "completed"));

    const [pendingCount] = await db.select({ total: count() }).from(paymentsTable).where(eq(paymentsTable.status, "pending"));

    const [platformFees] = await db.select({
      total: sql`COALESCE(SUM(CAST(${teacherEarningsTable.platformFee} AS NUMERIC)), 0)`,
    }).from(teacherEarningsTable);

    const [pendingEarnings] = await db.select({
      total: sql`COALESCE(SUM(CAST(${teacherEarningsTable.netAmount} AS NUMERIC)), 0)`,
    }).from(teacherEarningsTable).where(eq(teacherEarningsTable.status, "available"));

    res.json({
      totalUsers: Number(userCount.total),
      totalTeachers: Number(teacherCount.total),
      totalStudents: Number(studentCount.total),
      totalCourses: Number(courseCount.total),
      publishedCourses: Number(publishedCount.total),
      totalEnrollments: Number(enrollCount.total),
      totalSessions: Number(sessionCount.total),
      totalRevenue: parseFloat(revenueData.totalRevenue as string),
      platformFees: parseFloat(platformFees.total as string),
      pendingPayments: Number(pendingCount.total),
      pendingEarnings: parseFloat(pendingEarnings.total as string),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ─── USERS ────────────────────────────────────────────────────────────────────

router.get("/users", async (_req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    const result = await Promise.all(users.map(async (u) => {
      let extra: any = {};
      if (u.role === "teacher") {
        const [cc] = await db.select({ total: count() }).from(coursesTable).where(eq(coursesTable.teacherId, u.id));
        const [ec] = await db.select({ total: count() }).from(enrollmentsTable)
          .where(sql`${enrollmentsTable.courseId} IN (SELECT id FROM courses WHERE teacher_id = ${u.id})`);
        extra = { courseCount: Number(cc.total), studentCount: Number(ec.total) };
      } else if (u.role === "student") {
        const [ec] = await db.select({ total: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.userId, u.id));
        extra = { enrollmentCount: Number(ec.total) };
      }
      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        phoneNumber: u.phoneNumber,
        phoneVerified: u.phoneVerified,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        ...extra,
      };
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/users/:userId/verify", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { isVerified } = req.body;
    const [updated] = await db.update(usersTable)
      .set({ isVerified: !!isVerified, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ success: true, isVerified: updated.isVerified });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.put("/users/:userId/role", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { role } = req.body;
    if (!["student", "teacher", "admin"].includes(role)) {
      res.status(400).json({ error: "Invalid role" }); return;
    }
    const [updated] = await db.update(usersTable)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ success: true, user: { id: updated.id, role: updated.role } });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.delete("/users/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { userId: adminId } = (req as any).user;
    if (userId === adminId) { res.status(400).json({ error: "Cannot delete yourself" }); return; }
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/users/create", async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) { res.status(400).json({ error: "Email already registered" }); return; }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      email, passwordHash, fullName, role: role as any, language: "ar",
    }).returning();
    res.status(201).json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role, createdAt: user.createdAt });
  } catch (err: any) {
    res.status(400).json({ error: "Failed to create user", message: err.message });
  }
});

// ─── COURSES ─────────────────────────────────────────────────────────────────

router.get("/courses", async (_req, res) => {
  try {
    const courses = await db.select().from(coursesTable).orderBy(desc(coursesTable.createdAt));
    const result = await Promise.all(courses.map(async (c) => {
      const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, c.teacherId)).limit(1);
      const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, c.categoryId)).limit(1);
      const [enroll] = await db.select({ total: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, c.id));
      const [lessons] = await db.select({ total: count() }).from(lessonsTable).where(eq(lessonsTable.courseId, c.id));
      return {
        id: c.id,
        title: c.title,
        titleAr: c.titleAr,
        price: parseFloat(c.price),
        currency: c.currency,
        level: c.level,
        language: c.language,
        isPublished: c.isPublished,
        teacherId: c.teacherId,
        teacherName: teacher?.fullName || "Unknown",
        teacherEmail: teacher?.email || "",
        categoryName: cat?.name || "Uncategorized",
        enrollmentCount: Number(enroll.total),
        lessonCount: Number(lessons.total),
        revenue: parseFloat(c.price) * Number(enroll.total),
        createdAt: c.createdAt,
      };
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.put("/courses/:courseId/publish", async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const { isPublished } = req.body;
    const [updated] = await db.update(coursesTable)
      .set({ isPublished: !!isPublished, updatedAt: new Date() })
      .where(eq(coursesTable.id, courseId))
      .returning();
    if (!updated) { res.status(404).json({ error: "Course not found" }); return; }
    res.json({ success: true, isPublished: updated.isPublished });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.delete("/courses/:courseId", async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    await db.delete(coursesTable).where(eq(coursesTable.id, courseId));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

router.get("/payments", async (req, res) => {
  try {
    const { status } = req.query as any;
    let payments = await db.select().from(paymentsTable).orderBy(desc(paymentsTable.createdAt));
    if (status && status !== "all") {
      payments = payments.filter(p => p.status === status);
    }
    const result = await Promise.all(payments.map(async (p) => {
      const [student] = await db.select().from(usersTable).where(eq(usersTable.id, p.userId)).limit(1);
      let itemName = "–";
      if (p.courseId) {
        const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, p.courseId)).limit(1);
        itemName = course?.title || `Course #${p.courseId}`;
      } else if (p.sessionId) {
        const [session] = await db.select().from(liveSessionsTable).where(eq(liveSessionsTable.id, p.sessionId)).limit(1);
        itemName = session?.title || `Session #${p.sessionId}`;
      }
      return {
        id: p.id,
        userId: p.userId,
        studentName: student?.fullName || "Unknown",
        studentEmail: student?.email || "",
        courseId: p.courseId,
        sessionId: p.sessionId,
        itemName,
        amount: parseFloat(p.amount),
        currency: p.currency,
        method: p.method,
        status: p.status,
        reference: p.reference,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.get("/payments/pending", async (_req, res) => {
  try {
    const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.status, "pending"));
    const result = await Promise.all(payments.map(async (p) => {
      const [student] = await db.select().from(usersTable).where(eq(usersTable.id, p.userId)).limit(1);
      let itemName = "–";
      if (p.courseId) {
        const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, p.courseId)).limit(1);
        itemName = course?.title || `Course #${p.courseId}`;
      }
      return {
        id: p.id,
        userId: p.userId,
        studentName: student?.fullName || "Unknown",
        studentEmail: student?.email || "",
        itemName,
        amount: parseFloat(p.amount),
        currency: p.currency,
        status: p.status,
        reference: p.reference,
        createdAt: p.createdAt,
      };
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/payments/:paymentId/approve", async (req, res) => {
  try {
    const paymentId = parseInt(req.params.paymentId);
    const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId)).limit(1);
    if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
    if (payment.status !== "pending") { res.status(400).json({ error: `Payment is already ${payment.status}` }); return; }

    await db.update(paymentsTable).set({ status: "completed", updatedAt: new Date() }).where(eq(paymentsTable.id, paymentId));

    const amount = parseFloat(payment.amount);
    const PLATFORM_FEE_PERCENT = 20;
    const platformFee = parseFloat((amount * PLATFORM_FEE_PERCENT / 100).toFixed(2));
    const netAmount = parseFloat((amount - platformFee).toFixed(2));

    if (payment.courseId) {
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, payment.courseId)).limit(1);
      const alreadyEnrolled = await db.select().from(enrollmentsTable)
        .where(and(eq(enrollmentsTable.courseId, payment.courseId), eq(enrollmentsTable.userId, payment.userId))).limit(1);
      if (alreadyEnrolled.length === 0) {
        await db.insert(enrollmentsTable).values({ courseId: payment.courseId, userId: payment.userId, progress: "0" });
      }
      if (course) {
        await db.insert(teacherEarningsTable).values({
          teacherId: course.teacherId, paymentId,
          courseId: course.id,
          grossAmount: amount.toFixed(2),
          platformFeePercent: PLATFORM_FEE_PERCENT.toFixed(2),
          platformFee: platformFee.toFixed(2),
          netAmount: netAmount.toFixed(2),
          currency: course.currency || "LYD",
          status: "available",
        });
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/payments/:paymentId/reject", async (req, res) => {
  try {
    const paymentId = parseInt(req.params.paymentId);
    const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId)).limit(1);
    if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
    if (payment.status !== "pending") { res.status(400).json({ error: `Payment is already ${payment.status}` }); return; }
    await db.update(paymentsTable).set({ status: "failed", updatedAt: new Date() }).where(eq(paymentsTable.id, paymentId));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ─── FINANCE / EARNINGS ───────────────────────────────────────────────────────

router.get("/earnings", async (_req, res) => {
  try {
    const earnings = await db.select().from(teacherEarningsTable).orderBy(desc(teacherEarningsTable.createdAt));
    const result = await Promise.all(earnings.map(async (e) => {
      const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, e.teacherId)).limit(1);
      let itemName = "–";
      if (e.courseId) {
        const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, e.courseId)).limit(1);
        itemName = course?.title || `Course #${e.courseId}`;
      } else if (e.sessionId) {
        const [session] = await db.select().from(liveSessionsTable).where(eq(liveSessionsTable.id, e.sessionId)).limit(1);
        itemName = session?.title || `Session #${e.sessionId}`;
      }
      return {
        id: e.id,
        teacherId: e.teacherId,
        teacherName: teacher?.fullName || "Unknown",
        teacherEmail: teacher?.email || "",
        paymentId: e.paymentId,
        itemName,
        gross: parseFloat(e.grossAmount),
        platformFee: parseFloat(e.platformFee),
        net: parseFloat(e.netAmount),
        currency: e.currency,
        status: e.status,
        createdAt: e.createdAt,
      };
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/earnings/:earningId/pay", async (req, res) => {
  try {
    const earningId = parseInt(req.params.earningId);
    const [earning] = await db.select().from(teacherEarningsTable).where(eq(teacherEarningsTable.id, earningId)).limit(1);
    if (!earning) { res.status(404).json({ error: "Earning not found" }); return; }
    if (earning.status !== "available") { res.status(400).json({ error: "Earning not available for payout" }); return; }
    await db.update(teacherEarningsTable).set({ status: "paid" }).where(eq(teacherEarningsTable.id, earningId));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/earnings/pay-all/:teacherId", async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    const result = await db.update(teacherEarningsTable)
      .set({ status: "paid" })
      .where(and(eq(teacherEarningsTable.teacherId, teacherId), eq(teacherEarningsTable.status, "available")));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
