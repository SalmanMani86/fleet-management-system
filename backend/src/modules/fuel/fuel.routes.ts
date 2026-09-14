import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { createFuelRecordHandler, listFuelRecordsHandler } from "./fuel.controller";

export const fuelRouter = Router({ mergeParams: true });

fuelRouter.post("/", asyncHandler(createFuelRecordHandler));
fuelRouter.get("/", asyncHandler(listFuelRecordsHandler));
