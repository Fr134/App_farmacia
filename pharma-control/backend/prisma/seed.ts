import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Seed admin user ──────────────────────────────
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("Users already exist, skipping user seed.");
  } else {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.create({
      data: {
        email: "admin@pharmacontrol.it",
        password: hashedPassword,
        name: "Amministratore",
        role: "admin",
      },
    });
    console.log(`Created admin user: ${admin.email}`);
  }

  // ── Seed expense categories ──────────────────────
  const systemCategories = [
    { name: "Rent",         color: "#52b788", icon: "🏢" },
    { name: "Staff",        color: "#4a9eff", icon: "👤" },
    { name: "Utilities",    color: "#f4a535", icon: "⚡" },
    { name: "Software",     color: "#9b8ee8", icon: "💻" },
    { name: "Amortization", color: "#5ecfb5", icon: "📉" },
    { name: "Insurance",    color: "#ff7c5c", icon: "🛡️" },
    { name: "Maintenance",  color: "#e8a838", icon: "🔧" },
    { name: "Marketing",    color: "#f7c59f", icon: "📣" },
    { name: "Consulting",   color: "#e8c5ff", icon: "💼" },
    { name: "Other",        color: "#7b849a", icon: "📦" },
  ];

  for (const cat of systemCategories) {
    await prisma.expenseCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: { ...cat, is_system: true },
    });
  }

  console.log(`Seeded ${systemCategories.length} expense categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
