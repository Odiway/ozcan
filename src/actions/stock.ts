"use server";

import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getStockItems(search?: string) {
  const where = search
    ? {
        OR: [
          { filterCode: { contains: search, mode: "insensitive" as const } },
          { normalizedCode: { contains: search, mode: "insensitive" as const } },
          { donaldsonCode: { contains: search, mode: "insensitive" as const } },
          { mahleCode: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  return prisma.stockItem.findMany({
    where,
    orderBy: { filterCode: "asc" },
    take: 100,
  });
}

export async function updateStockQuantity(id: string, quantity: number) {
  const item = await prisma.stockItem.update({
    where: { id },
    data: { quantity },
  });
  await logAction("UPDATE", "StockItem", id, `Updated stock for ${item.filterCode} to ${quantity}`);
  revalidatePath("/dashboard/stock");
  return item;
}

export async function createStockItem(data: {
  filterCode: string;
  donaldsonCode?: string;
  mahleCode?: string;
  quantity: number;
}) {
  const normalizedCode = data.filterCode
    .toUpperCase()
    .replace(/[-/,\s]/g, "")
    .trim();

  const item = await prisma.stockItem.create({
    data: {
      filterCode: data.filterCode.toUpperCase().trim(),
      normalizedCode,
      donaldsonCode: data.donaldsonCode || null,
      mahleCode: data.mahleCode || null,
      quantity: data.quantity,
    },
  });
  await logAction("CREATE", "StockItem", item.id, `Added stock item: ${data.filterCode}`);
  revalidatePath("/dashboard/stock");
  return item;
}

export async function bulkNormalizeCodes() {
  const items = await prisma.stockItem.findMany();
  let updated = 0;

  for (const item of items) {
    const normalized = item.filterCode
      .toUpperCase()
      .replace(/[-/,\s]/g, "")
      .trim();

    if (normalized !== item.normalizedCode) {
      await prisma.stockItem.update({
        where: { id: item.id },
        data: { normalizedCode: normalized },
      });
      updated++;
    }
  }

  await logAction("UPDATE", "StockItem", undefined, `Bulk normalized ${updated} stock codes`);
  revalidatePath("/dashboard/stock");
  return { updated };
}
