import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { listCustomersHandler, createCustomerHandler, getCustomerHandler } from "./customer.controller";

export const customerRouter = Router({ mergeParams: true });

customerRouter.get("/", asyncHandler(listCustomersHandler));
customerRouter.post("/", asyncHandler(createCustomerHandler));
customerRouter.get("/:id", asyncHandler(getCustomerHandler));
