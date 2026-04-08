import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { generateToken, comparePassword } from "../lib/auth";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate } from "../middleware/auth";

const router = Router();

const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Password obbligatoria"),
});

// POST /api/auth/login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.errors[0].message,
      });
      return;
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { pharmacy: { select: { id: true, name: true } } },
    });
    if (!user) {
      res.status(401).json({
        success: false,
        error: "Email o password non validi",
      });
      return;
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      res.status(401).json({
        success: false,
        error: "Email o password non validi",
      });
      return;
    }

    // Update last_login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24h
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          pharmacyId: user.pharmacy_id,
          pharmacyName: user.pharmacy.name,
        },
      },
    });
  })
);

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

// GET /api/auth/me
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true, pharmacy_id: true, pharmacy: { select: { name: true } } },
    });

    if (!user) {
      res.status(404).json({ success: false, error: "Utente non trovato" });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        pharmacyId: user.pharmacy_id,
        pharmacyName: user.pharmacy.name,
      },
    });
  })
);

export default router;
