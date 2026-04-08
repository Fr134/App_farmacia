import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";

export async function getAll() {
  const pharmacies = await prisma.pharmacy.findMany({
    orderBy: { created_at: "desc" },
    include: { _count: { select: { users: true } } },
  });
  return pharmacies.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    phone: p.phone,
    email: p.email,
    createdAt: p.created_at,
    userCount: p._count.users,
  }));
}

export async function getById(id: string) {
  const p = await prisma.pharmacy.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    address: p.address,
    phone: p.phone,
    email: p.email,
    createdAt: p.created_at,
    userCount: p._count.users,
  };
}

export interface CreatePharmacyInput {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export async function createWithAdmin(data: CreatePharmacyInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.adminEmail } });
  if (existing) {
    throw new Error("Email già in uso");
  }

  const hashed = await hashPassword(data.adminPassword);

  const result = await prisma.$transaction(async (tx) => {
    const pharmacy = await tx.pharmacy.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
      },
    });

    await tx.user.create({
      data: {
        email: data.adminEmail,
        password: hashed,
        name: data.adminName,
        role: "admin",
        pharmacy_id: pharmacy.id,
      },
    });

    // Clone default expense categories for the new pharmacy
    const defaultCategories = [
      { name: "Affitto", icon: "Building2", color: "#3B82F6", is_system: true },
      { name: "Utenze", icon: "Zap", color: "#F59E0B", is_system: true },
      { name: "Personale", icon: "Users", color: "#8B5CF6", is_system: true },
      { name: "Forniture", icon: "Package", color: "#10B981", is_system: true },
      { name: "Marketing", icon: "Megaphone", color: "#06B6D4", is_system: true },
      { name: "Altro", icon: "MoreHorizontal", color: "#64748B", is_system: true },
    ];

    for (const cat of defaultCategories) {
      await tx.expenseCategory.create({
        data: { ...cat, pharmacy_id: pharmacy.id },
      });
    }

    return pharmacy;
  });

  return {
    id: result.id,
    name: result.name,
    address: result.address,
    phone: result.phone,
    email: result.email,
    createdAt: result.created_at,
  };
}

export async function update(id: string, data: { name?: string; address?: string; phone?: string; email?: string }) {
  const pharmacy = await prisma.pharmacy.update({
    where: { id },
    data,
  });
  return {
    id: pharmacy.id,
    name: pharmacy.name,
    address: pharmacy.address,
    phone: pharmacy.phone,
    email: pharmacy.email,
    createdAt: pharmacy.created_at,
  };
}

export async function remove(id: string) {
  // Check if pharmacy has any data
  const counts = await prisma.pharmacy.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true, reports: true, expenses: true, budgets: true, sivat_assessments: true },
      },
    },
  });

  if (!counts) throw new Error("Farmacia non trovata");

  const total = counts._count.users + counts._count.reports + counts._count.expenses + counts._count.budgets + counts._count.sivat_assessments;
  if (total > 0) {
    throw new Error("Impossibile eliminare: la farmacia contiene dati. Rimuovi prima utenti e dati associati.");
  }

  // Delete expense categories (no FK cascade issue since no expenses)
  await prisma.expenseCategory.deleteMany({ where: { pharmacy_id: id } });
  await prisma.pharmacy.delete({ where: { id } });
}
