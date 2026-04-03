import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

const prisma = new PrismaClient();

const EXCEL_PATH = path.resolve(__dirname, "../../DİYAROVA - ÖZCAN.xlsm");

function normalizeCode(code: string): string {
  if (!code) return "";
  return code.toString().replace(/[-\/,\s.]/g, "").toUpperCase().trim();
}

function safeString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function safeNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

async function importCustomers(workbook: XLSX.WorkBook) {
  console.log("👥 Importing customers from 'CARİ İSKONTO'...");
  const sheet = workbook.Sheets["CARİ İSKONTO"];
  if (!sheet) {
    console.log("⚠️ Sheet 'CARİ İSKONTO' not found, skipping customers.");
    return;
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  let imported = 0;
  let skipped = 0;

  // Skip header row (row 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;

    const name = safeString(row[0]);
    if (!name || name === "CARİ İSİM" || name.length < 2) continue;

    const discountRate = safeNumber(row[1]);

    // Determine payment plan from row context
    let paymentPlan: "NAKIT" | "VADELI" | "EURO" = "NAKIT";
    const planStr = safeString(row[2]).toUpperCase();
    if (planStr.includes("EURO")) paymentPlan = "EURO";
    else if (planStr.includes("VADE")) paymentPlan = "VADELI";

    try {
      await prisma.customer.upsert({
        where: { name },
        update: { discountRate, paymentPlan },
        create: {
          name,
          discountRate,
          paymentPlan,
        },
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  console.log(`  ✅ Imported ${imported} customers (${skipped} skipped)`);
}

async function importDonaldsonProducts(workbook: XLSX.WorkBook) {
  console.log("🏭 Importing Donaldson products from 'DONALDSON FİYAT LİSTESİ'...");
  const sheet = workbook.Sheets["DONALDSON FİYAT LİSTESİ"];
  if (!sheet) {
    console.log("⚠️ Sheet 'DONALDSON FİYAT LİSTESİ' not found, skipping.");
    return;
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  let imported = 0;

  // Batch insert for performance
  const products: {
    partNumber: string;
    description: string;
    netPrice: number;
  }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;

    const partNumber = safeString(row[0]);
    if (!partNumber || partNumber.length < 2) continue;

    const description = safeString(row[1]);
    const netPrice = safeNumber(row[2]);

    products.push({
      partNumber,
      description,
      netPrice,
    });
  }

  // Insert in batches of 500
  for (let i = 0; i < products.length; i += 500) {
    const batch = products.slice(i, i + 500);
    try {
      await prisma.donaldsonProduct.createMany({
        data: batch,
        skipDuplicates: true,
      });
      imported += batch.length;
    } catch (e) {
      // Fall back to individual inserts
      for (const p of batch) {
        try {
          await prisma.donaldsonProduct.upsert({
            where: { partNumber: p.partNumber },
            update: p,
            create: p,
          });
          imported++;
        } catch {
          // skip
        }
      }
    }
    process.stdout.write(`\r  Processing... ${Math.min(i + 500, products.length)}/${products.length}`);
  }

  console.log(`\n  ✅ Imported ${imported} Donaldson products`);
}

async function importMahleProducts(workbook: XLSX.WorkBook) {
  console.log("🏭 Importing MAHLE products from 'MAHLE FİYAT LİSTESİ'...");
  const sheet = workbook.Sheets["MAHLE FİYAT LİSTESİ"];
  if (!sheet) {
    console.log("⚠️ Sheet 'MAHLE FİYAT LİSTESİ' not found, skipping.");
    return;
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const products: {
    mahleRef: string;
    description: string;
    price: number;
  }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;

    const mahleRef = safeString(row[0]);
    if (!mahleRef || mahleRef.length < 2) continue;

    const description = safeString(row[1]);
    const price = safeNumber(row[2]);

    products.push({
      mahleRef,
      description,
      price,
    });
  }

  let imported = 0;
  for (let i = 0; i < products.length; i += 500) {
    const batch = products.slice(i, i + 500);
    try {
      await prisma.mahleProduct.createMany({
        data: batch,
        skipDuplicates: true,
      });
      imported += batch.length;
    } catch {
      for (const p of batch) {
        try {
          await prisma.mahleProduct.upsert({
            where: { mahleRef: p.mahleRef },
            update: p,
            create: p,
          });
          imported++;
        } catch {
          // skip
        }
      }
    }
    process.stdout.write(`\r  Processing... ${Math.min(i + 500, products.length)}/${products.length}`);
  }

  console.log(`\n  ✅ Imported ${imported} MAHLE products`);
}

async function importBaveriaProducts(workbook: XLSX.WorkBook) {
  console.log("🏭 Importing Baveria-Woodson products from 'BAVERİA (WOODSON) FİYAT LİS'...");
  // Sheet name might be truncated
  const sheetName = Object.keys(workbook.Sheets).find(
    (s) => s.includes("BAVERİA") || s.includes("BAVERIA") || s.includes("WOODSON")
  );

  if (!sheetName) {
    console.log("⚠️ Baveria sheet not found, skipping.");
    return;
  }

  const sheet = workbook.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const products: {
    filterCode: string;
    unitPriceUsd: number;
  }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;

    const filterCode = safeString(row[0]);
    if (!filterCode || filterCode.length < 2) continue;

    const unitPriceUsd = safeNumber(row[1]);

    products.push({
      filterCode,
      unitPriceUsd,
    });
  }

  let imported = 0;
  for (let i = 0; i < products.length; i += 500) {
    const batch = products.slice(i, i + 500);
    try {
      await prisma.baveriaProduct.createMany({
        data: batch,
        skipDuplicates: true,
      });
      imported += batch.length;
    } catch {
      for (const p of batch) {
        try {
          await prisma.baveriaProduct.upsert({
            where: { filterCode: p.filterCode },
            update: p,
            create: p,
          });
          imported++;
        } catch {
          // skip
        }
      }
    }
    process.stdout.write(`\r  Processing... ${Math.min(i + 500, products.length)}/${products.length}`);
  }

  console.log(`\n  ✅ Imported ${imported} Baveria products`);
}

async function importShippingRates(workbook: XLSX.WorkBook) {
  console.log("📦 Importing shipping rates from 'YURTİÇİ KARGO FİYAT'...");
  const sheetName = Object.keys(workbook.Sheets).find(
    (s) => s.includes("KARGO") || s.includes("kargo")
  );

  if (!sheetName) {
    console.log("⚠️ Shipping rate sheet not found, skipping.");
    return;
  }

  const sheet = workbook.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  let imported = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row[0] === null || row[0] === undefined) continue;

    const desi = safeNumber(row[0]);
    if (desi <= 0) continue;

    const netPrice = safeNumber(row[1]);
    const kdvIncluded = safeNumber(row[2]) || netPrice * 1.2;

    try {
      await prisma.shippingRate.upsert({
        where: { desi },
        update: { netPrice, kdvIncluded },
        create: { desi, netPrice, kdvIncluded },
      });
      imported++;
    } catch {
      // skip
    }
  }

  console.log(`  ✅ Imported ${imported} shipping rates`);
}

async function main() {
  console.log("📊 Excel Data Import Tool");
  console.log("========================");

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`❌ Excel file not found at: ${EXCEL_PATH}`);
    process.exit(1);
  }

  console.log(`📁 Reading: ${EXCEL_PATH}`);
  const workbook = XLSX.readFile(EXCEL_PATH);
  console.log(`📋 Sheets found: ${workbook.SheetNames.join(", ")}\n`);

  await importCustomers(workbook);
  await importDonaldsonProducts(workbook);
  await importMahleProducts(workbook);
  await importBaveriaProducts(workbook);
  await importShippingRates(workbook);

  console.log("\n🎉 Excel data import complete!");
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
