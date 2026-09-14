import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  listDriversHandler,
  createDriverHandler,
  getDriverHandler,
  setDriverStatusHandler,
} from "./driver.controller";

export const driverRouter = Router({ mergeParams: true });

driverRouter.get("/", asyncHandler(listDriversHandler));
driverRouter.post("/", asyncHandler(createDriverHandler));
driverRouter.get("/:id", asyncHandler(getDriverHandler));
driverRouter.post("/:id/status", asyncHandler(setDriverStatusHandler));
