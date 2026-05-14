import { Router } from "express";
import { db } from "@workspace/db";
import {
  paymentsTable,
  teacherEarningsTable,
  enrollmentsTable,
  coursesTable,
  liveSessionsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, sum, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

const PLATFORM_FEE_PERCENT = 20;

async function creditTeacher(paymentId: number, teacherId: number, amount: number, courseId?: number, sessionId?: number, currency = "LYD") {
  const platformFee = parseFloat((amount * PLATFORM_FEE_PERCENT / 100).toFixed(2));
  const netAmount = parseFloat((amount - platformFee).toFixed(2));
  await db.insert(teacherEarningsTable).values({
    teacherId,
    paymentId,
    courseId: courseId || null,
    sessionId: sessionId || null,
    grossAmount: amount.toFixed(2),
    platformFeePercent: PLATFORM_FEE_PERCENT.toFixed(2),
    platformFee: platformFee.toFixed(2),
    netAmount: netAmount.toFixed(2),
    currency,
    status: "available",
  });
}

// --- Automated Payment Gateway Simulation ---

router.post("/create-session", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const { type, itemId } = req.body; // type: 'course' or 'session', itemId: number

    let amount = 0;
    let currency = "LYD";
    let course = null;
    let session = null;

    if (type === "course") {
      [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, itemId)).limit(1);
      if (!course) { res.status(404).json({ error: "Course not found" }); return; }
      
      const existing = await db.select().from(enrollmentsTable)
        .where(and(eq(enrollmentsTable.courseId, itemId), eq(enrollmentsTable.userId, userId)))
        .limit(1);
      if (existing.length > 0) { res.status(400).json({ error: "Already enrolled" }); return; }
      
      amount = parseFloat(course.price);
      currency = course.currency || "LYD";
    } else if (type === "session") {
      [session] = await db.select().from(liveSessionsTable).where(eq(liveSessionsTable.id, itemId)).limit(1);
      if (!session) { res.status(404).json({ error: "Session not found" }); return; }
      amount = parseFloat(session.price);
    } else {
      res.status(400).json({ error: "Invalid type" }); return;
    }

    if (amount === 0) {
      // Free item, auto-enroll
      if (type === "course") {
        await db.insert(enrollmentsTable).values({ courseId: itemId, userId, progress: "0" });
      }
      return void res.json({ url: "/dashboard?success=true" });
    }

    // Paid item, create pending payment session
    const [payment] = await db.insert(paymentsTable).values({
      userId,
      courseId: type === "course" ? itemId : null,
      sessionId: type === "session" ? itemId : null,
      amount: amount.toFixed(2),
      currency,
      method: "bank_transfer",
      status: "pending",
      reference: `SESS-${Date.now()}`,
    }).returning();

    // In a real integration (Stripe/Sadad), this URL is returned from the provider's API.
    // Here we generate our local simulation URL.
    const checkoutUrl = `/api/payments/mock-gateway?paymentId=${payment.id}`;
    
    res.json({ url: checkoutUrl });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.get("/mock-gateway", (req, res) => {
  const paymentId = req.query.paymentId;
  // This serves a small HTML page to simulate an external provider like Sadad or Stripe.
  res.send(`
    <html>
      <head>
        <title>Secure Payment Gateway</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f9fafb; margin: 0; }
          .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px; width: 100%; border-top: 4px solid #0ea5e9; }
          h2 { margin-top: 0; color: #0f172a; }
          button { background: #0ea5e9; color: white; border: none; padding: 1rem 2rem; border-radius: 0.5rem; font-size: 1.1rem; font-weight: bold; cursor: pointer; width: 100%; margin-top: 1rem; }
          button:hover { background: #0284c7; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Secure Payment</h2>
          <p>You are about to authorize a payment for Libyan Learn Hub.</p>
          <form action="/api/payments/callback" method="GET">
            <input type="hidden" name="paymentId" value="${paymentId}" />
            <input type="hidden" name="status" value="success" />
            <button type="submit">Pay Now</button>
          </form>
          <form action="/api/payments/callback" method="GET" style="margin-top: 0.5rem;">
            <input type="hidden" name="paymentId" value="${paymentId}" />
            <input type="hidden" name="status" value="cancel" />
            <button type="submit" style="background: white; color: #64748b; border: 1px solid #cbd5e1;">Cancel</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

router.get("/callback", async (req, res) => {
  try {
    const paymentId = parseInt(req.query.paymentId as string);
    const status = req.query.status as string; // 'success' or 'cancel'

    if (isNaN(paymentId)) { res.status(400).send("Invalid payment ID"); return; }

    const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId)).limit(1);
    if (!payment) { res.status(404).send("Payment not found"); return; }
    if (payment.status === "completed") { res.redirect('/dashboard?success=true'); return; }

    if (status === "cancel") {
      await db.update(paymentsTable).set({ status: "failed" }).where(eq(paymentsTable.id, paymentId));
      res.redirect('/dashboard?error=payment_cancelled'); return;
    }

    // Success flow
    await db.update(paymentsTable)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(paymentsTable.id, paymentId));

    const amount = parseFloat(payment.amount);

    if (payment.courseId) {
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, payment.courseId)).limit(1);
      const alreadyEnrolled = await db.select().from(enrollmentsTable)
        .where(and(eq(enrollmentsTable.courseId, payment.courseId), eq(enrollmentsTable.userId, payment.userId)))
        .limit(1);
      
      if (alreadyEnrolled.length === 0) {
        await db.insert(enrollmentsTable).values({ courseId: payment.courseId, userId: payment.userId, progress: "0" });
      }
      if (course) {
        await creditTeacher(paymentId, course.teacherId, amount, course.id, undefined, course.currency);
      }
    }

    if (payment.sessionId) {
      const [session] = await db.select().from(liveSessionsTable).where(eq(liveSessionsTable.id, payment.sessionId)).limit(1);
      if (session) {
        await creditTeacher(paymentId, session.teacherId, amount, undefined, session.id, "LYD");
      }
    }

    // Redirect to frontend success page
    res.redirect('/dashboard?success=true');
  } catch (err: any) {
    res.status(500).send("Server Error");
  }
});


router.get("/", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.userId, userId));
    res.json(payments.map(p => ({ ...p, amount: parseFloat(p.amount) })));
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.get("/earnings", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const earnings = await db.select().from(teacherEarningsTable).where(eq(teacherEarningsTable.teacherId, userId));
    const available = earnings.filter(e => e.status === "available").reduce((s, e) => s + parseFloat(e.netAmount), 0);
    const pending = earnings.filter(e => e.status === "pending").reduce((s, e) => s + parseFloat(e.netAmount), 0);
    const paid = earnings.filter(e => e.status === "paid").reduce((s, e) => s + parseFloat(e.netAmount), 0);
    const total = available + pending + paid;
    res.json({
      total: parseFloat(total.toFixed(2)),
      available: parseFloat(available.toFixed(2)),
      pending: parseFloat(pending.toFixed(2)),
      paid: parseFloat(paid.toFixed(2)),
      entries: earnings.map(e => ({
        id: e.id,
        courseId: e.courseId,
        sessionId: e.sessionId,
        gross: parseFloat(e.grossAmount),
        platformFee: parseFloat(e.platformFee),
        net: parseFloat(e.netAmount),
        currency: e.currency,
        status: e.status,
        createdAt: e.createdAt,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
