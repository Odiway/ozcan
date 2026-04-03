import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({ take: 15 });
  console.log("=== CUSTOMERS (first 15) ===");
  customers.forEach((c) =>
    console.log(`"${c.name}" | discount:${c.discountRate} | plan:${c.paymentPlan}`)
  );
  console.log("Total customers:", await prisma.customer.count());

  const don = await prisma.donaldsonProduct.findMany({ take: 5 });
  console.log("\n=== DONALDSON (first 5) ===");
  don.forEach((d) => console.log(`"${d.partNumber}" | "${d.description}" | €${d.netPrice}`));

  const mahle = await prisma.mahleProduct.findMany({ take: 5 });
  console.log("\n=== MAHLE (first 5) ===");
  mahle.forEach((m) => console.log(`"${m.mahleRef}" | "${m.description}" | €${m.price}`));

  const bav = await prisma.baveriaProduct.findMany({ take: 5 });
  console.log("\n=== BAVERIA (first 5) ===");
  bav.forEach((b) => console.log(`"${b.filterCode}" | $${b.unitPriceUsd}`));

  const rates = await prisma.exchangeRate.findMany();
  console.log("\n=== EXCHANGE RATES ===");
  rates.forEach((r) => console.log(`${r.currency}: ${r.rate}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
