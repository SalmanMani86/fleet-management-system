import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { getVehicleProfileHandler } from "./vehicleProfile.controller";

export const vehicleProfileRouter = Router({ mergeParams: true });

vehicleProfileRouter.get("/:vehicleId", asyncHandler(getVehicleProfileHandler));
