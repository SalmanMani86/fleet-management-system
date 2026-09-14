import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  listVehiclesHandler,
  createVehicleHandler,
  getVehicleHandler,
  setVehicleStatusHandler,
} from "./vehicle.controller";

export const vehicleRouter = Router({ mergeParams: true });

vehicleRouter.get("/", asyncHandler(listVehiclesHandler));
vehicleRouter.post("/", asyncHandler(createVehicleHandler));
vehicleRouter.get("/:id", asyncHandler(getVehicleHandler));
vehicleRouter.post("/:id/status", asyncHandler(setVehicleStatusHandler));
