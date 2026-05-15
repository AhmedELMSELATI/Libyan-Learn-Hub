import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth.js";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { rateLimit } from "express-rate-limit";
import { PLANS } from "../lib/plans.js";
import type { TeacherTier } from "../lib/plans.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: "Too many login/registration attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/register", authLimiter, async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).json({ error: "Missing request body. Check Content-Type headers." });
      return;
    }
    
    // Support phoneNumber in the validation gracefully
    const body = RegisterBody.passthrough().parse(req.body);
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, body.email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const otpCode = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const phoneNumber = req.body.phoneNumber || null;

    // Accept plan tier during teacher registration; students are always 'free'
    const requestedTier = req.body.tier as TeacherTier | undefined;
    const validTiers: TeacherTier[] = ["free", "bronze", "golden"];
    const tier: TeacherTier = (body.role === "teacher" && requestedTier && validTiers.includes(requestedTier))
      ? requestedTier
      : "free";

    const [user] = await db.insert(usersTable).values({
      email: body.email,
      passwordHash,
      fullName: body.fullName,
      fullNameAr: body.fullNameAr,
      role: body.role as any,
      language: (body.language as any) || "ar",
      phoneNumber,
      otpCode,
      otpExpiry,
      tier,
    }).returning();
    const token = signToken({ userId: user.id, role: user.role });
    const plan = PLANS[(user.tier as TeacherTier) || "free"];
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        fullNameAr: user.fullNameAr,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        bioAr: user.bioAr,
        language: user.language,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        tier: user.tier,
        storageUsed: user.storageUsed,
        storageLimitBytes: plan.storageLimitBytes,
        isBonusUnlocked: user.isBonusUnlocked,
        createdAt: user.createdAt,
      },
      token,
      otpCode,
      otpMessage: user.phoneNumber
        ? `Your verification code is: ${otpCode} (In production this would be sent via SMS to ${user.phoneNumber})`
        : `Your email verification code is: ${otpCode}`,
    });
  } catch (err: any) {
    res.status(400).json({ error: "Validation failed", message: err.message });
  }
});

router.post("/send-otp", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const otpCode = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const [user] = await db.update(usersTable)
      .set({ otpCode, otpExpiry })
      .where(eq(usersTable.id, userId))
      .returning();
    res.json({
      message: "OTP sent",
      otpCode,
      otpMessage: user.phoneNumber
        ? `Your verification code is: ${otpCode} (In production this would be sent via SMS to ${user.phoneNumber})`
        : `Your verification code is: ${otpCode}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/verify-otp", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const { code, type } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    if (!user.otpCode || user.otpCode !== code) {
      res.status(400).json({ error: "Invalid verification code" });
      return;
    }
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      res.status(400).json({ error: "Verification code has expired" });
      return;
    }
    const updateData: any = { otpCode: null, otpExpiry: null };
    if (type === "phone") updateData.phoneVerified = true;
    else updateData.emailVerified = true;
    const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, userId)).returning();
    res.json({
      success: true,
      message: type === "phone" ? "Phone verified successfully" : "Email verified successfully",
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
        phoneNumber: updated.phoneNumber,
        phoneVerified: updated.phoneVerified,
        emailVerified: updated.emailVerified,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const body = LoginBody.parse(req.body);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, body.email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken({ userId: user.id, role: user.role });
    const plan = PLANS[(user.tier as TeacherTier) || "free"];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        fullNameAr: user.fullNameAr,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        bioAr: user.bioAr,
        language: user.language,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        tier: user.tier,
        storageUsed: user.storageUsed,
        storageLimitBytes: plan.storageLimitBytes,
        isBonusUnlocked: user.isBonusUnlocked,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err: any) {
    res.status(400).json({ error: "Validation failed", message: err.message });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out" });
});

router.post("/update-password", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Missing password fields" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Incorrect current password" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ passwordHash, updatedAt: new Date() }).where(eq(usersTable.id, userId));

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const { userId } = (req as any).user;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const plan = PLANS[(user.tier as TeacherTier) || "free"];
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    fullNameAr: user.fullNameAr,
    role: user.role,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    bioAr: user.bioAr,
    language: user.language,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    emailVerified: user.emailVerified,
    tier: user.tier,
    storageUsed: user.storageUsed,
    storageLimitBytes: plan.storageLimitBytes,
    isBonusUnlocked: user.isBonusUnlocked,
    createdAt: user.createdAt,
  });
});

export default router;
