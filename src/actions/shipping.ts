"use server";

import { prisma } from "@/lib/prisma";

export async function calculateShipping(
  dimensions: Array<{ width: number; height: number; depth: number }>
) {
  let totalDesi = 0;

  for (const dim of dimensions) {
    const desi = Math.ceil((dim.width * dim.height * dim.depth) / 3000);
    totalDesi += desi;
  }

  const shippingRate = await prisma.shippingRate.findFirst({
    where: { desi: { gte: totalDesi } },
    orderBy: { desi: "asc" },
  });

  if (!shippingRate) {
    // Find the highest rate
    const maxRate = await prisma.shippingRate.findFirst({
      orderBy: { desi: "desc" },
    });
    return {
      totalDesi,
      netPrice: maxRate?.netPrice || 0,
      kdvIncluded: maxRate?.kdvIncluded || 0,
      rateFound: false,
    };
  }

  return {
    totalDesi,
    netPrice: shippingRate.netPrice,
    kdvIncluded: shippingRate.kdvIncluded,
    rateFound: true,
  };
}

export async function getShippingRates() {
  return prisma.shippingRate.findMany({
    orderBy: { desi: "asc" },
  });
}
