import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { listAuditLogsHandler } from "./auditLog.controller";

export const auditLogRouter = Router({ mergeParams: true });

auditLogRouter.get("/", asyncHandler(listAuditLogsHandler));
