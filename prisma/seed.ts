import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@ozcanfiltre.com" },
    update: {},
    create: {
      email: "admin@ozcanfiltre.com",
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Create manager user
  const managerPassword = await bcrypt.hash("manager123", 12);
  await prisma.user.upsert({
    where: { email: "satis@ozcanfiltre.com" },
    update: {},
    create: {
      email: "satis@ozcanfiltre.com",
      name: "Satış Temsilcisi",
      password: managerPassword,
      role: "SALES_REP",
    },
  });

  // Seed exchange rates
  await prisma.exchangeRate.upsert({
    where: { currency: "EUR" },
    update: { rate: 38 },
    create: { currency: "EUR", rate: 38 },
  });

  await prisma.exchangeRate.upsert({
    where: { currency: "USD" },
    update: { rate: 36 },
    create: { currency: "USD", rate: 36 },
  });

  // Seed some sample shipping rates (Yurtiçi Kargo)
  const shippingRates = [
    { desi: 1, netPrice: 45, kdvIncluded: 54 },
    { desi: 2, netPrice: 50, kdvIncluded: 60 },
    { desi: 3, netPrice: 55, kdvIncluded: 66 },
    { desi: 5, netPrice: 65, kdvIncluded: 78 },
    { desi: 10, netPrice: 85, kdvIncluded: 102 },
    { desi: 15, netPrice: 105, kdvIncluded: 126 },
    { desi: 20, netPrice: 125, kdvIncluded: 150 },
    { desi: 25, netPrice: 145, kdvIncluded: 174 },
    { desi: 30, netPrice: 165, kdvIncluded: 198 },
    { desi: 50, netPrice: 250, kdvIncluded: 300 },
    { desi: 100, netPrice: 450, kdvIncluded: 540 },
  ];

  for (const rate of shippingRates) {
    await prisma.shippingRate.upsert({
      where: { desi: rate.desi },
      update: rate,
      create: rate,
    });
  }

  console.log("✅ Base seed complete!");
  console.log("📧 Admin login: admin@ozcanfiltre.com / admin123");
  console.log("📧 Sales login: satis@ozcanfiltre.com / manager123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
