import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  createMaintenanceRecordHandler,
  listMaintenanceRecordsHandler,
  getMaintenanceRecordHandler,
  transitionMaintenanceStatusHandler,
  getMaintenanceStatusHistoryHandler,
} from "./maintenance.controller";

export const maintenanceRouter = Router({ mergeParams: true });

maintenanceRouter.post("/", asyncHandler(createMaintenanceRecordHandler));
maintenanceRouter.get("/", asyncHandler(listMaintenanceRecordsHandler));
maintenanceRouter.get("/:id", asyncHandler(getMaintenanceRecordHandler));
maintenanceRouter.post("/:id/status", asyncHandler(transitionMaintenanceStatusHandler));
maintenanceRouter.get("/:id/history", asyncHandler(getMaintenanceStatusHistoryHandler));
