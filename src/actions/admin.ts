"use server";

import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
      _count: { select: { quotes: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "SALES_REP";
}) {
  const hashedPassword = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });
  await logAction("CREATE", "User", user.id, `Created user: ${data.email}`);
  revalidatePath("/dashboard/users");
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    role?: "ADMIN" | "MANAGER" | "SALES_REP";
    active?: boolean;
    password?: string;
  }
) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 12);
  } else {
    delete updateData.password;
  }

  const user = await prisma.user.update({ where: { id }, data: updateData });
  await logAction("UPDATE", "User", id, `Updated user: ${user.email}`);
  revalidatePath("/dashboard/users");
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function getAuditLogs(page = 1, entity?: string) {
  const take = 50;
  const skip = (page - 1) * take;
  const where = entity ? { entity } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, pages: Math.ceil(total / take) };
}
