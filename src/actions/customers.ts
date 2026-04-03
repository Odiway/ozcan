"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getCustomers(search?: string) {
  const where = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {};

  return prisma.customer.findMany({
    where: { ...where, active: true },
    orderBy: { name: "asc" },
  });
}

export async function getCustomer(id: string) {
  return prisma.customer.findUnique({ where: { id } });
}

export async function createCustomer(data: {
  name: string;
  paymentPlan: "NAKIT" | "VADELI" | "EURO";
  discountRate: number;
  notes?: string;
  machineInfo?: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  const customer = await prisma.customer.create({ data });
  await logAction("CREATE", "Customer", customer.id, `Created customer: ${data.name}`);
  revalidatePath("/dashboard/customers");
  return customer;
}

export async function updateCustomer(
  id: string,
  data: {
    name?: string;
    paymentPlan?: "NAKIT" | "VADELI" | "EURO";
    discountRate?: number;
    notes?: string;
    machineInfo?: string;
    phone?: string;
    email?: string;
    address?: string;
  }
) {
  const customer = await prisma.customer.update({ where: { id }, data });
  await logAction("UPDATE", "Customer", id, `Updated customer: ${customer.name}`);
  revalidatePath("/dashboard/customers");
  return customer;
}

export async function deleteCustomer(id: string) {
  const customer = await prisma.customer.update({
    where: { id },
    data: { active: false },
  });
  await logAction("DELETE", "Customer", id, `Deactivated customer: ${customer.name}`);
  revalidatePath("/dashboard/customers");
  return customer;
}
