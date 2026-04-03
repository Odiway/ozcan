"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { lookupFilterPrice } from "./products";

export async function getQuotes(page = 1, search?: string, status?: string) {
  const take = 20;
  const skip = (page - 1) * take;
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { quoteNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      skip,
      take,
      include: {
        customer: { select: { name: true } },
        user: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quote.count({ where }),
  ]);

  return { quotes, total, pages: Math.ceil(total / take) };
}

export async function getQuote(id: string) {
  return prisma.quote.findUnique({
    where: { id },
    include: {
      customer: true,
      user: { select: { name: true, email: true } },
      items: { orderBy: { lineNumber: "asc" } },
    },
  });
}

async function generateQuoteNumber() {
  const date = new Date();
  const prefix = `TKL-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const lastQuote = await prisma.quote.findFirst({
    where: { quoteNumber: { startsWith: prefix } },
    orderBy: { quoteNumber: "desc" },
  });

  if (lastQuote) {
    const lastNum = parseInt(lastQuote.quoteNumber.split("-").pop() || "0");
    return `${prefix}-${String(lastNum + 1).padStart(4, "0")}`;
  }

  return `${prefix}-0001`;
}

export async function createQuote(data: {
  customerId: string;
  paymentMethod: "NAKIT" | "VADELI" | "EURO";
  euroRate?: number;
  usdRate?: number;
  notes?: string;
  items: Array<{
    filterCode: string;
    customerCode?: string;
    quantity: number;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
  });
  if (!customer) throw new Error("Customer not found");

  const quoteNumber = await generateQuoteNumber();
  const euroRate = data.euroRate || 1;
  const usdRate = data.usdRate || 1;
  const kdvRate = 0.20;

  // Lookup prices for all items
  const itemsWithPrices = await Promise.all(
    data.items.map(async (item, index) => {
      const priceInfo = await lookupFilterPrice(
        item.filterCode,
        data.paymentMethod,
        customer.discountRate,
        euroRate,
        usdRate
      );

      const unitPrice = priceInfo?.unitPrice || 0;
      const unitPriceWithKdv =
        data.paymentMethod === "NAKIT" || data.paymentMethod === "VADELI"
          ? Math.ceil(unitPrice * (1 + kdvRate))
          : unitPrice;

      return {
        lineNumber: index + 1,
        filterCode: item.filterCode.toUpperCase().trim(),
        customerCode: item.customerCode || null,
        quantity: item.quantity,
        unitPrice,
        unitPriceWithKdv,
        totalNetPrice: unitPrice * item.quantity,
        listPrice: priceInfo?.listPrice || null,
        discountedPrice: priceInfo?.euroPrice || null,
        supplierSource: priceInfo?.source || "UNKNOWN",
      };
    })
  );

  const totalNetPrice = itemsWithPrices.reduce((sum, item) => sum + item.totalNetPrice, 0);
  const totalWithKdv =
    data.paymentMethod === "NAKIT" || data.paymentMethod === "VADELI"
      ? Math.ceil(totalNetPrice * (1 + kdvRate))
      : totalNetPrice;

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      customerId: data.customerId,
      userId: session.user.id,
      paymentMethod: data.paymentMethod,
      discountRate: customer.discountRate,
      euroRate,
      usdRate,
      notes: data.notes,
      totalNetPrice,
      totalWithKdv,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day default
      items: {
        create: itemsWithPrices,
      },
    },
    include: {
      items: true,
      customer: true,
    },
  });

  await logAction("CREATE", "Quote", quote.id, `Created quote ${quoteNumber} for ${customer.name}`);
  revalidatePath("/dashboard/quotes");
  return quote;
}

export async function updateQuoteStatus(id: string, status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED") {
  const quote = await prisma.quote.update({
    where: { id },
    data: { status },
  });
  await logAction("UPDATE", "Quote", id, `Updated quote ${quote.quoteNumber} status to ${status}`);
  revalidatePath("/dashboard/quotes");
  revalidatePath(`/dashboard/quotes/${id}`);
  return quote;
}

export async function deleteQuote(id: string) {
  const quote = await prisma.quote.delete({ where: { id } });
  await logAction("DELETE", "Quote", id, `Deleted quote ${quote.quoteNumber}`);
  revalidatePath("/dashboard/quotes");
  return quote;
}
