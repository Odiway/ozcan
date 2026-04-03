import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function logAction(
  action: string,
  entity: string,
  entityId?: string,
  details?: string
) {
  try {
    const session = await auth();
    await prisma.auditLog.create({
      data: {
        userId: session?.user?.id || null,
        action,
        entity,
        entityId,
        details,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
