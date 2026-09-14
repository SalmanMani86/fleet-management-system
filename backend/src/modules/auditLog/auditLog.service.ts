import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

type TxClient = Prisma.TransactionClient;

export async function recordAuditLog(
  tx: TxClient,
  params: {
    companyId: string;
    action: string;
    entityType: string;
    entityId: string;
    beforeState?: unknown;
    afterState?: unknown;
  }
): Promise<void> {
  await tx.auditLog.create({
    data: {
      companyId: params.companyId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeState: params.beforeState === undefined ? Prisma.JsonNull : (params.beforeState as Prisma.InputJsonValue),
      afterState: params.afterState === undefined ? Prisma.JsonNull : (params.afterState as Prisma.InputJsonValue),
    },
  });
}

export async function listAuditLogs(companyId: string, entityType?: string, entityId?: string) {
  return prisma.auditLog.findMany({
    where: { companyId, ...(entityType ? { entityType } : {}), ...(entityId ? { entityId } : {}) },
    orderBy: { createdAt: "desc" },
  });
}
