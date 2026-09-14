import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  createVehicleDocumentHandler,
  listVehicleDocumentsHandler,
  getVehicleDocumentHandler,
  listExpiringDocumentsHandler,
} from "./vehicleDocument.controller";

export const vehicleDocumentRouter = Router({ mergeParams: true });

vehicleDocumentRouter.post("/", asyncHandler(createVehicleDocumentHandler));
vehicleDocumentRouter.get("/expiring", asyncHandler(listExpiringDocumentsHandler));
vehicleDocumentRouter.get("/vehicle/:vehicleId", asyncHandler(listVehicleDocumentsHandler));
vehicleDocumentRouter.get("/:id", asyncHandler(getVehicleDocumentHandler));
