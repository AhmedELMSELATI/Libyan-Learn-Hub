import { Router } from "express";
import { db } from "@workspace/db";
import { lessonsTable, enrollmentsTable, coursesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import https from "https";
import http from "http";
import { requireAuth } from "../lib/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "default_super_secret_jwt_key_for_dev_only";

// 1. Endpoint to generate a short-lived playback token for a specific lesson
router.post("/generate-token", requireAuth, async (req, res) => {
  try {
    const { lessonId, courseId } = req.body;
    const { userId, role } = (req as any).user;

    const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, parseInt(lessonId))).limit(1);
    if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }

    if (!lesson.isFree && role !== 'admin') {
      const [enrollment] = await db.select().from(enrollmentsTable)
        .where(and(eq(enrollmentsTable.courseId, parseInt(courseId)), eq(enrollmentsTable.userId, userId)))
        .limit(1);
      
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, parseInt(courseId))).limit(1);
      
      if (!enrollment && course?.teacherId !== userId) {
        res.status(403).json({ error: "Not enrolled in this course" });
        return;
      }
    }

    // Generate a short-lived token (e.g., 6 hours) specifically for this user and lesson
    const playbackToken = jwt.sign(
      { userId, lessonId: parseInt(lessonId), action: "playback" },
      JWT_SECRET,
      { expiresIn: "6h" }
    );

    const isHls = lesson.videoFilePath?.endsWith('.m3u8') || false;

    res.json({ 
      token: playbackToken, 
      url: lesson.videoFilePath || `/api/video/secure-stream/${lessonId}?token=${playbackToken}`,
      isHls 
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// 2. The actual streaming endpoint that validates the token and pipes the video
router.get("/secure-stream/:lessonId", async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const token = req.query.token as string;

    if (!token) return res.status(401).send("No playback token provided");

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).send("Invalid or expired playback token");
    }

    if (payload.lessonId !== lessonId || payload.action !== "playback") {
      return res.status(403).send("Token mismatch or invalid action");
    }

    const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId)).limit(1);
    if (!lesson) return res.status(404).send("Video not found");

    // If lesson has a Cloudinary-hosted video, redirect to it
    if (lesson.videoFilePath) {
      return res.redirect(lesson.videoFilePath);
    }

    if (!lesson.videoUrl) return res.status(404).send("Video not found");

    // Block caching to enhance DRM simulation
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Disposition", "inline"); // Play inline, don't trigger download

    // Proxy the video chunk by chunk
    const url = new URL(lesson.videoUrl);
    const client = url.protocol === "https:" ? https : http;

    const options = {
      headers: {
        'Range': req.headers.range || 'bytes=0-',
        'User-Agent': req.headers['user-agent'] || 'Libyan-Learn-Hub-Proxy',
      }
    };

    client.get(lesson.videoUrl, options, (remoteRes) => {
      const statusCode = remoteRes.statusCode || 200;
      // Copy essential headers like Content-Type, Content-Length, Content-Range, Accept-Ranges
      const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
      const headers: Record<string, string | string[]> = {};
      
      for (const h of headersToCopy) {
        if (remoteRes.headers[h]) headers[h] = remoteRes.headers[h]!;
      }

      res.writeHead(statusCode, headers);
      remoteRes.pipe(res);
    }).on('error', (err) => {
      console.error("Video proxy error:", err);
      res.status(500).send("Error streaming secure video");
    });

  } catch (err: any) {
    res.status(500).send("Server Error");
  }
});

export default router;
