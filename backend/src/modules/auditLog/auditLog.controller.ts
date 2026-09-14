import { Request, Response } from "express";
import { listAuditLogs } from "./auditLog.service";

export async function listAuditLogsHandler(req: Request, res: Response): Promise<void> {
  const { entityType, entityId } = req.query;
  const logs = await listAuditLogs(
    req.companyId,
    typeof entityType === "string" ? entityType : undefined,
    typeof entityId === "string" ? entityId : undefined
  );
  res.json(logs);
}
