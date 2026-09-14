import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  listVehicleModelsHandler,
  createVehicleModelHandler,
  getVehicleModelHandler,
} from "./vehicleModel.controller";

export const vehicleModelRouter = Router({ mergeParams: true });

vehicleModelRouter.get("/", asyncHandler(listVehicleModelsHandler));
vehicleModelRouter.post("/", asyncHandler(createVehicleModelHandler));
vehicleModelRouter.get("/:id", asyncHandler(getVehicleModelHandler));
