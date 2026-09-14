import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  createTripHandler,
  listTripsHandler,
  getTripHandler,
  transitionTripStatusHandler,
  setTripAmountHandler,
} from "./trip.controller";

export const tripRouter = Router({ mergeParams: true });

tripRouter.post("/", asyncHandler(createTripHandler));
tripRouter.get("/", asyncHandler(listTripsHandler));
tripRouter.get("/:id", asyncHandler(getTripHandler));
tripRouter.post("/:id/status", asyncHandler(transitionTripStatusHandler));
tripRouter.post("/:id/amount", asyncHandler(setTripAmountHandler));
