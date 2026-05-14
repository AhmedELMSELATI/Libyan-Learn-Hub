import { Router } from "express";
import { db } from "@workspace/db";
import { tutoringListingsTable, tutoringApplicationsTable, usersTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";
import { parseParam } from "../lib/utils.js";
import crypto from "crypto";

const router = Router();

async function formatListing(listing: any) {
  const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, listing.teacherId)).limit(1);
  return {
    ...listing,
    hourlyRate: parseFloat(listing.hourlyRate),
    teacherName: teacher?.fullName || "",
    teacherNameAr: teacher?.fullNameAr || "",
    teacherAvatar: teacher?.avatarUrl || null,
    teacherBio: teacher?.bio || "",
    teacherExpertise: teacher?.expertise || "",
    teacherRating: parseFloat(teacher?.tutoringHourlyRate || "0"),
  };
}

// List all active listings (for students to browse)
router.get("/", async (req, res) => {
  try {
    const { subject, gradeLevel, teacherId } = req.query as any;
    let listings = await db
      .select()
      .from(tutoringListingsTable)
      .where(eq(tutoringListingsTable.status, "active"))
      .orderBy(desc(tutoringListingsTable.createdAt));

    if (subject) listings = listings.filter(l => l.subject.toLowerCase().includes(subject.toLowerCase()));
    if (gradeLevel) listings = listings.filter(l => l.gradeLevel === gradeLevel);
    if (teacherId) listings = listings.filter(l => l.teacherId === parseParam(teacherId));

    const result = await Promise.all(listings.map(formatListing));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Teacher: get my listings
router.get("/my", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const listings = await db
      .select()
      .from(tutoringListingsTable)
      .where(eq(tutoringListingsTable.teacherId, userId))
      .orderBy(desc(tutoringListingsTable.createdAt));
    const result = await Promise.all(listings.map(formatListing));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Get single listing with applications (teacher) or just listing (student)
router.get("/:id", async (req, res) => {
  try {
    const id = parseParam(req.params.id);
    const [listing] = await db.select().from(tutoringListingsTable).where(eq(tutoringListingsTable.id, id)).limit(1);
    if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
    res.json(await formatListing(listing));
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Teacher: create listing
router.post("/", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const {
      title, titleAr, subject, subjectAr, gradeLevel, gradeLevelAr,
      description, descriptionAr, hourlyRate, currency,
      maxStudents, availableDays, availableTimeFrom, availableTimeTo,
      sessionDurationMinutes,
    } = req.body;

    const [listing] = await db.insert(tutoringListingsTable).values({
      teacherId: userId,
      title, titleAr, subject, subjectAr,
      gradeLevel: gradeLevel || null,
      gradeLevelAr: gradeLevelAr || null,
      description, descriptionAr,
      hourlyRate: parseFloat(hourlyRate).toString(),
      currency: currency || "LYD",
      maxStudents: maxStudents || 1,
      availableDays: availableDays || null,
      availableTimeFrom: availableTimeFrom || null,
      availableTimeTo: availableTimeTo || null,
      sessionDurationMinutes: sessionDurationMinutes || 60,
    }).returning();

    res.status(201).json(await formatListing(listing));
  } catch (err: any) {
    res.status(400).json({ error: "Failed to create listing", message: err.message });
  }
});

// Teacher: update listing
router.put("/:id", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const id = parseParam(req.params.id);
    const { title, titleAr, subject, subjectAr, gradeLevel, gradeLevelAr, description, descriptionAr, hourlyRate, maxStudents, availableDays, availableTimeFrom, availableTimeTo, sessionDurationMinutes, status } = req.body;
    const [updated] = await db.update(tutoringListingsTable)
      .set({ title, titleAr, subject, subjectAr, gradeLevel, gradeLevelAr, description, descriptionAr, hourlyRate: hourlyRate?.toString(), maxStudents, availableDays, availableTimeFrom, availableTimeTo, sessionDurationMinutes, status, updatedAt: new Date() })
      .where(and(eq(tutoringListingsTable.id, id), eq(tutoringListingsTable.teacherId, userId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Listing not found or unauthorized" }); return; }
    res.json(await formatListing(updated));
  } catch (err: any) {
    res.status(400).json({ error: "Failed to update listing", message: err.message });
  }
});

// Teacher: delete listing
router.delete("/:id", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const id = parseParam(req.params.id);
    await db.delete(tutoringListingsTable).where(and(eq(tutoringListingsTable.id, id), eq(tutoringListingsTable.teacherId, userId)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: "Failed to delete listing", message: err.message });
  }
});

// Student: apply to a listing
router.post("/:id/apply", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const listingId = parseParam(req.params.id);
    const { message, preferredAt } = req.body;

    const [listing] = await db.select().from(tutoringListingsTable).where(eq(tutoringListingsTable.id, listingId)).limit(1);
    if (!listing || listing.status !== "active") {
      res.status(400).json({ error: "Listing not available" }); return;
    }

    const existing = await db.select().from(tutoringApplicationsTable)
      .where(and(eq(tutoringApplicationsTable.listingId, listingId), eq(tutoringApplicationsTable.studentId, userId)));
    if (existing.length > 0) {
      res.status(400).json({ error: "You have already applied to this listing" }); return;
    }

    const [app] = await db.insert(tutoringApplicationsTable).values({
      listingId, studentId: userId,
      message: message || null,
      preferredAt: preferredAt ? new Date(preferredAt) : null,
    }).returning();

    await db.update(tutoringListingsTable)
      .set({ totalApplications: sql`${tutoringListingsTable.totalApplications} + 1` })
      .where(eq(tutoringListingsTable.id, listingId));

    res.status(201).json(app);
  } catch (err: any) {
    res.status(400).json({ error: "Failed to apply", message: err.message });
  }
});

// Teacher: get applications for my listing
router.get("/:id/applications", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const listingId = parseParam(req.params.id);

    const [listing] = await db.select().from(tutoringListingsTable)
      .where(and(eq(tutoringListingsTable.id, listingId), eq(tutoringListingsTable.teacherId, userId))).limit(1);
    if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }

    const applications = await db.select().from(tutoringApplicationsTable)
      .where(eq(tutoringApplicationsTable.listingId, listingId))
      .orderBy(desc(tutoringApplicationsTable.createdAt));

    const result = await Promise.all(applications.map(async (app) => {
      const [student] = await db.select().from(usersTable).where(eq(usersTable.id, app.studentId)).limit(1);
      return {
        ...app,
        studentName: student?.fullName || "",
        studentNameAr: student?.fullNameAr || "",
        studentEmail: student?.email || "",
        studentAvatar: student?.avatarUrl || null,
      };
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Teacher: accept application
router.post("/applications/:appId/accept", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const appId = parseParam(req.params.appId);
    const { teacherNote } = req.body;
    const roomId = `edulibya-tutoring-${appId}-${crypto.randomBytes(4).toString("hex")}`;
    const meetingUrl = `https://meet.jit.si/${roomId}`;

    const [app] = await db.select().from(tutoringApplicationsTable).where(eq(tutoringApplicationsTable.id, appId)).limit(1);
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }

    const [listing] = await db.select().from(tutoringListingsTable).where(and(eq(tutoringListingsTable.id, app.listingId), eq(tutoringListingsTable.teacherId, userId))).limit(1);
    if (!listing) { res.status(403).json({ error: "Unauthorized" }); return; }

    const [updated] = await db.update(tutoringApplicationsTable)
      .set({ status: "accepted", teacherNote, meetingUrl, updatedAt: new Date() })
      .where(eq(tutoringApplicationsTable.id, appId))
      .returning();

    res.json({ success: true, meetingUrl, application: updated });
  } catch (err: any) {
    res.status(400).json({ error: "Failed to accept application", message: err.message });
  }
});

// Teacher: decline application
router.post("/applications/:appId/decline", requireAuth, requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const appId = parseParam(req.params.appId);
    const { teacherNote } = req.body;

    const [app] = await db.select().from(tutoringApplicationsTable).where(eq(tutoringApplicationsTable.id, appId)).limit(1);
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }
    const [listing] = await db.select().from(tutoringListingsTable).where(and(eq(tutoringListingsTable.id, app.listingId), eq(tutoringListingsTable.teacherId, userId))).limit(1);
    if (!listing) { res.status(403).json({ error: "Unauthorized" }); return; }

    await db.update(tutoringApplicationsTable).set({ status: "declined", teacherNote, updatedAt: new Date() }).where(eq(tutoringApplicationsTable.id, appId));
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: "Failed to decline application", message: err.message });
  }
});

// Student: get my applications
router.get("/my-applications/list", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const apps = await db.select().from(tutoringApplicationsTable)
      .where(eq(tutoringApplicationsTable.studentId, userId))
      .orderBy(desc(tutoringApplicationsTable.createdAt));

    const result = await Promise.all(apps.map(async (app) => {
      const [listing] = await db.select().from(tutoringListingsTable).where(eq(tutoringListingsTable.id, app.listingId)).limit(1);
      const [teacher] = listing ? await db.select().from(usersTable).where(eq(usersTable.id, listing.teacherId)).limit(1) : [null];
      return {
        ...app,
        listing: listing ? { ...listing, hourlyRate: parseFloat(listing.hourlyRate) } : null,
        teacherName: teacher?.fullName || "",
        teacherNameAr: teacher?.fullNameAr || "",
      };
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Student: cancel application
router.post("/applications/:appId/cancel", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const appId = parseParam(req.params.appId);
    await db.update(tutoringApplicationsTable).set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(tutoringApplicationsTable.id, appId), eq(tutoringApplicationsTable.studentId, userId)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: "Failed to cancel application", message: err.message });
  }
});

export default router;
