import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

const prisma = new PrismaClient();

const EXCEL_PATH = path.resolve(__dirname, "../../DİYAROVA - ÖZCAN.xlsm");

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

  // Layout: [0]=NO, [1]=CARİ ÜNVANI, [2]=ÖDEME PLANI, [3]=İSKONTO, [4]=NOTLAR, [5]=Makine Bilgisi
  // Second list: [7]=CARİ ÜNVANI, [8]=ÖDEME PLANI, [9]=İSKONTO
  // Row 0 is empty, Row 1 is header
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    // First list (columns 1-5)
    const name1 = safeString(row[1]);
    if (name1 && name1.length >= 2 && name1 !== "CARİ ÜNVANI") {
      const discountRate = safeNumber(row[3]);
      let paymentPlan: "NAKIT" | "VADELI" | "EURO" = "NAKIT";
      const planStr = safeString(row[2]).toUpperCase();
      if (planStr.includes("EURO")) paymentPlan = "EURO";
      else if (planStr.includes("VADE")) paymentPlan = "VADELI";

      const notes = safeString(row[4]) || undefined;
      const machineInfo = safeString(row[5]) || undefined;

      try {
        await prisma.customer.upsert({
          where: { name: name1 },
          update: { discountRate, paymentPlan, notes, machineInfo },
          create: { name: name1, discountRate, paymentPlan, notes, machineInfo },
        });
        imported++;
      } catch {
        skipped++;
      }
    }

    // Second list (columns 7-9)
    const name2 = safeString(row[7]);
    if (name2 && name2.length >= 2 && name2 !== "CARİ ÜNVANI") {
      const discountRate2 = safeNumber(row[9]);
      let paymentPlan2: "NAKIT" | "VADELI" | "EURO" = "NAKIT";
      const planStr2 = safeString(row[8]).toUpperCase();
      if (planStr2.includes("EURO")) paymentPlan2 = "EURO";
      else if (planStr2.includes("VADE")) paymentPlan2 = "VADELI";

      try {
        await prisma.customer.upsert({
          where: { name: name2 },
          update: { discountRate: discountRate2, paymentPlan: paymentPlan2 },
          create: { name: name2, discountRate: discountRate2, paymentPlan: paymentPlan2 },
        });
        imported++;
      } catch {
        skipped++;
      }
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

  // Layout: [0]=NO, [1]=Base Partnumber, [2]=Description, [3]=Net Price
  const products: {
    partNumber: string;
    description: string;
    netPrice: number;
  }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const partNumber = safeString(row[1]);
    if (!partNumber || partNumber.length < 2 || partNumber === "Base Partnumber") continue;

    const description = safeString(row[2]);
    const netPrice = safeNumber(row[3]);

    products.push({ partNumber, description, netPrice });
  }

  for (let i = 0; i < products.length; i += 500) {
    const batch = products.slice(i, i + 500);
    try {
      await prisma.donaldsonProduct.createMany({
        data: batch,
        skipDuplicates: true,
      });
      imported += batch.length;
    } catch {
      for (const p of batch) {
        try {
          await prisma.donaldsonProduct.upsert({
            where: { partNumber: p.partNumber },
            update: p,
            create: p,
          });
          imported++;
        } catch { /* skip */ }
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

  // Layout: [0]=MAHLERef, [1]=MAHLE Code, [2]=KNECHT, [3]=Vehicle Group,
  //          [4]=Product Name, [5]=Availability, [6]=Description,
  //          [7]=Superseded to, [8]=Price, [9]=Valid from, [10]=Valid to
  const products: {
    mahleRef: string;
    mahleCode: string | null;
    knechtCode: string | null;
    vehicleGroup: string | null;
    productName: string | null;
    availability: string | null;
    description: string | null;
    supersededTo: string | null;
    price: number;
  }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const mahleRef = safeString(row[0]);
    if (!mahleRef || mahleRef.length < 2 || mahleRef === "MAHLERef") continue;

    const mahleCode = safeString(row[1]) || null;
    const knechtCode = safeString(row[2]) || null;
    const vehicleGroup = safeString(row[3]) || null;
    const productName = safeString(row[4]) || null;
    const availability = safeString(row[5]) || null;
    const description = safeString(row[6]) || null;
    const supersededTo = safeString(row[7]) || null;
    const price = safeNumber(row[8]);

    products.push({
      mahleRef, mahleCode, knechtCode, vehicleGroup,
      productName, availability, description, supersededTo, price,
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
        } catch { /* skip */ }
      }
    }
    process.stdout.write(`\r  Processing... ${Math.min(i + 500, products.length)}/${products.length}`);
  }

  console.log(`\n  ✅ Imported ${imported} MAHLE products`);
}

async function importBaveriaProducts(workbook: XLSX.WorkBook) {
  console.log("🏭 Importing Baveria-Woodson products...");
  const sheetName = Object.keys(workbook.Sheets).find(
    (s) => s.includes("BAVERİA") || s.includes("BAVERIA") || s.includes("WOODSON")
  );
  if (!sheetName) {
    console.log("⚠️ Baveria sheet not found, skipping.");
    return;
  }

  const sheet = workbook.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Layout: [0]=NO, [1]=BAVERIA FİLTRE KODU, [2]=BİRİM FİYATI($),
  //          [3]=İSKONTO TUTARI, ..., [10]=NO, [11]=WOODSON code
  // Row 0 = header info, Row 1 = column headers, data starts at Row 2
  const products: {
    filterCode: string;
    unitPriceUsd: number;
    discountRate: number;
    woodsonCode: string | null;
  }[] = [];

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const filterCode = safeString(row[1]);
    if (!filterCode || filterCode.length < 2) continue;

    const unitPriceUsd = safeNumber(row[2]);
    const discountRate = safeNumber(row[3]) || 0.43;
    const woodsonCode = safeString(row[11]) || null;

    products.push({ filterCode, unitPriceUsd, discountRate, woodsonCode });
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
        } catch { /* skip */ }
      }
    }
    process.stdout.write(`\r  Processing... ${Math.min(i + 500, products.length)}/${products.length}`);
  }

  console.log(`\n  ✅ Imported ${imported} Baveria products`);
}

async function importShippingRates(workbook: XLSX.WorkBook) {
  console.log("📦 Importing shipping rates...");
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

  // Layout: col[22]=DESİ, col[23]=NET FİYAT, col[24]=KDV DAHİL
  // Row 2 is header, data starts at Row 3
  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const desi = safeNumber(row[22]);
    if (desi < 0) continue;

    const netPrice = safeNumber(row[23]);
    const kdvIncluded = safeNumber(row[24]) || netPrice * 1.2;

    if (netPrice <= 0) continue;

    try {
      await prisma.shippingRate.upsert({
        where: { desi },
        update: { netPrice, kdvIncluded },
        create: { desi, netPrice, kdvIncluded },
      });
      imported++;
    } catch { /* skip */ }
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
