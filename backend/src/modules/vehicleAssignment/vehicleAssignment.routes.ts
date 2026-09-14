import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  assignDriverHandler,
  unassignVehicleHandler,
  getCurrentAssignmentHandler,
  getAssignmentHistoryHandler,
} from "./vehicleAssignment.controller";

export const vehicleAssignmentRouter = Router({ mergeParams: true });

vehicleAssignmentRouter.post("/", asyncHandler(assignDriverHandler));
vehicleAssignmentRouter.post("/:vehicleId/unassign", asyncHandler(unassignVehicleHandler));
vehicleAssignmentRouter.get("/:vehicleId/current", asyncHandler(getCurrentAssignmentHandler));
vehicleAssignmentRouter.get("/:vehicleId/history", asyncHandler(getAssignmentHistoryHandler));
