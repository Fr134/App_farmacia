import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";
import { asyncHandler } from "../middleware/async-handler";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

// All routes require admin
router.use(authenticate, authorize("admin"));

const createUserSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
  name: z.string().min(1, "Nome obbligatorio"),
  role: z.enum(["admin", "viewer"], {
    errorMap: () => ({ message: "Il ruolo deve essere 'admin' o 'viewer'" }),
  }),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["admin", "viewer"]).optional(),
  password: z.string().min(6).optional(),
});

function serializeUser(user: { id: string; email: string; name: string; role: string; created_at: Date; last_login: Date | null }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.created_at.toISOString(),
    lastLogin: user.last_login?.toISOString() ?? null,
  };
}

// GET /api/users
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        last_login: true,
      },
    });

    res.json({ success: true, data: users.map(serializeUser) });
  })
);

// POST /api/users
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.errors[0].message,
      });
      return;
    }

    const { email, password, name, role } = parsed.data;

    // Check uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({
        success: false,
        error: "Esiste già un utente con questa email",
      });
      return;
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        last_login: true,
      },
    });

    res.status(201).json({ success: true, data: serializeUser(user) });
  })
);

// PATCH /api/users/:id
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.errors[0].message,
      });
      return;
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name) data.name = parsed.data.name;
    if (parsed.data.role) data.role = parsed.data.role;
    if (parsed.data.password) data.password = await hashPassword(parsed.data.password);

    if (Object.keys(data).length === 0) {
      res.status(400).json({ success: false, error: "Nessun campo da aggiornare" });
      return;
    }

    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          created_at: true,
          last_login: true,
        },
      });

      res.json({ success: true, data: serializeUser(user) });
    } catch {
      res.status(404).json({ success: false, error: "Utente non trovato" });
    }
  })
);

// DELETE /api/users/:id
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (req.user!.userId === req.params.id) {
      res.status(400).json({
        success: false,
        error: "Non puoi eliminare il tuo account",
      });
      return;
    }

    try {
      await prisma.user.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch {
      res.status(404).json({ success: false, error: "Utente non trovato" });
    }
  })
);

export default router;
