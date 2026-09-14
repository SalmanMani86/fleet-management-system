import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  listTrailersHandler,
  createTrailerHandler,
  getTrailerHandler,
  setTrailerStatusHandler,
} from "./trailer.controller";

export const trailerRouter = Router({ mergeParams: true });

trailerRouter.get("/", asyncHandler(listTrailersHandler));
trailerRouter.post("/", asyncHandler(createTrailerHandler));
trailerRouter.get("/:id", asyncHandler(getTrailerHandler));
trailerRouter.post("/:id/status", asyncHandler(setTrailerStatusHandler));
