"use server";

import { prisma } from "@/lib/prisma";

export async function searchProducts(query: string) {
  if (!query || query.length < 2) return { donaldson: [], mahle: [], baveria: [] };

  const [donaldson, mahle, baveria] = await Promise.all([
    prisma.donaldsonProduct.findMany({
      where: {
        OR: [
          { partNumber: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
    }),
    prisma.mahleProduct.findMany({
      where: {
        OR: [
          { mahleRef: { contains: query, mode: "insensitive" } },
          { mahleCode: { contains: query, mode: "insensitive" } },
          { knechtCode: { contains: query, mode: "insensitive" } },
          { productName: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
    }),
    prisma.baveriaProduct.findMany({
      where: {
        OR: [
          { filterCode: { contains: query, mode: "insensitive" } },
          { woodsonCode: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
    }),
  ]);

  return { donaldson, mahle, baveria };
}

export async function getDonaldsonProducts(page = 1, search?: string) {
  const take = 50;
  const skip = (page - 1) * take;
  const where = search
    ? {
        OR: [
          { partNumber: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma.donaldsonProduct.findMany({ where, skip, take, orderBy: { partNumber: "asc" } }),
    prisma.donaldsonProduct.count({ where }),
  ]);

  return { products, total, pages: Math.ceil(total / take) };
}

export async function getMahleProducts(page = 1, search?: string) {
  const take = 50;
  const skip = (page - 1) * take;
  const where = search
    ? {
        OR: [
          { mahleRef: { contains: search, mode: "insensitive" as const } },
          { productName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma.mahleProduct.findMany({ where, skip, take, orderBy: { mahleRef: "asc" } }),
    prisma.mahleProduct.count({ where }),
  ]);

  return { products, total, pages: Math.ceil(total / take) };
}

export async function getBaveriaProducts(page = 1, search?: string) {
  const take = 50;
  const skip = (page - 1) * take;
  const where = search
    ? {
        OR: [
          { filterCode: { contains: search, mode: "insensitive" as const } },
          { woodsonCode: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma.baveriaProduct.findMany({ where, skip, take, orderBy: { filterCode: "asc" } }),
    prisma.baveriaProduct.count({ where }),
  ]);

  return { products, total, pages: Math.ceil(total / take) };
}

export async function lookupFilterPrice(filterCode: string, paymentPlan: string, discountRate: number, euroRate: number, usdRate: number) {
  // Try Donaldson first
  const donaldson = await prisma.donaldsonProduct.findFirst({
    where: { partNumber: { equals: filterCode, mode: "insensitive" } },
  });

  if (donaldson) {
    const currencyRate = paymentPlan === "EURO" ? 1 : euroRate;
    const basePrice = donaldson.netPrice * (1 - discountRate) * currencyRate;
    const unitPrice =
      paymentPlan === "NAKIT" || paymentPlan === "VADELI"
        ? Math.ceil(basePrice)
        : Math.round(basePrice * 100) / 100;

    return {
      source: "DONALDSON",
      unitPrice,
      listPrice: donaldson.netPrice * currencyRate,
      euroPrice: donaldson.netPrice * (1 - discountRate),
    };
  }

  // Try MAHLE
  const mahle = await prisma.mahleProduct.findFirst({
    where: { mahleRef: { equals: filterCode, mode: "insensitive" } },
  });

  if (mahle) {
    const mahleMarkup = 0.15;
    const currencyRate = paymentPlan === "EURO" ? 1 : euroRate;
    const basePrice = mahle.price * (1 + mahleMarkup) * currencyRate;
    const unitPrice =
      paymentPlan === "NAKIT" || paymentPlan === "VADELI"
        ? Math.ceil(basePrice)
        : basePrice;

    return {
      source: "MAHLE",
      unitPrice,
      listPrice: mahle.price * currencyRate,
      euroPrice: mahle.price * (1 + mahleMarkup),
    };
  }

  // Try Baveria-Woodson
  const baveria = await prisma.baveriaProduct.findFirst({
    where: {
      OR: [
        { filterCode: { equals: filterCode, mode: "insensitive" } },
        { woodsonCode: { equals: filterCode, mode: "insensitive" } },
      ],
    },
  });

  if (baveria) {
    const baveriaMarkup = 0.40;
    const netPriceUsd = baveria.unitPriceUsd * (1 - baveria.discountRate);
    const netPrice = netPriceUsd * usdRate;
    const salePrice = Math.ceil(netPrice * (1 + baveriaMarkup));

    return {
      source: "BAVERIA",
      unitPrice: salePrice,
      listPrice: baveria.unitPriceUsd * usdRate,
      euroPrice: netPrice / euroRate,
    };
  }

  return null;
}
