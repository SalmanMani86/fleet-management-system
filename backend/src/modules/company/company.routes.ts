import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { listCompaniesHandler, createCompanyHandler } from "./company.controller";

export const companyRouter = Router();

companyRouter.get("/", asyncHandler(listCompaniesHandler));
companyRouter.post("/", asyncHandler(createCompanyHandler));
