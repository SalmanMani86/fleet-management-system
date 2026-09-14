import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  assignTrailerHandler,
  unassignTrailerHandler,
  getCurrentTrailerAssignmentHandler,
  getTrailerAssignmentHistoryHandler,
} from "./trailerAssignment.controller";

export const trailerAssignmentRouter = Router({ mergeParams: true });

trailerAssignmentRouter.post("/", asyncHandler(assignTrailerHandler));
trailerAssignmentRouter.post("/:vehicleId/unassign", asyncHandler(unassignTrailerHandler));
trailerAssignmentRouter.get("/:vehicleId/current", asyncHandler(getCurrentTrailerAssignmentHandler));
trailerAssignmentRouter.get("/:vehicleId/history", asyncHandler(getTrailerAssignmentHistoryHandler));
