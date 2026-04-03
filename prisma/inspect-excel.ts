import * as XLSX from "xlsx";
import * as path from "path";

const EXCEL_PATH = path.resolve(__dirname, "../../DİYAROVA - ÖZCAN.xlsm");
const workbook = XLSX.readFile(EXCEL_PATH);

function inspectSheet(name: string, maxRows = 8) {
  const sheet = workbook.Sheets[name];
  if (!sheet) {
    console.log(`Sheet "${name}" not found`);
    return;
  }
  console.log(`\n========== ${name} ==========`);
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  console.log(`Range: ${sheet["!ref"]} (cols: ${range.e.c + 1}, rows: ${range.e.r + 1})`);
  
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  for (let i = 0; i < Math.min(maxRows, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    const cells = (row as unknown[]).map((c, j) => `[${j}]=${c}`).join(" | ");
    console.log(`Row ${i}: ${cells}`);
  }
}

inspectSheet("CARİ İSKONTO", 10);
inspectSheet("DONALDSON FİYAT LİSTESİ", 10);
inspectSheet("MAHLE FİYAT LİSTESİ", 10);

// Find Baveria sheet
const bavSheet = workbook.SheetNames.find(s => s.includes("BAVERİA") || s.includes("BAVERIA") || s.includes("WOODSON"));
if (bavSheet) inspectSheet(bavSheet, 10);

const kargoSheet = workbook.SheetNames.find(s => s.includes("KARGO"));
if (kargoSheet) inspectSheet(kargoSheet, 10);
