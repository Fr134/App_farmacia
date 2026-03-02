import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log("Users already exist, skipping seed.");
    return;
  }

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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
