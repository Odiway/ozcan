import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️ Clearing old data...");

  await prisma.quoteItem.deleteMany();
  console.log("  Deleted all quote items");

  await prisma.quote.deleteMany();
  console.log("  Deleted all quotes");

  await prisma.stockItem.deleteMany();
  console.log("  Deleted all stock items");

  await prisma.shippingRate.deleteMany();
  console.log("  Deleted all shipping rates");

  await prisma.donaldsonProduct.deleteMany();
  console.log("  Deleted all Donaldson products");

  await prisma.mahleProduct.deleteMany();
  console.log("  Deleted all MAHLE products");

  await prisma.baveriaProduct.deleteMany();
  console.log("  Deleted all Baveria products");

  await prisma.customer.deleteMany();
  console.log("  Deleted all customers");

  console.log("✅ All data cleared!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
