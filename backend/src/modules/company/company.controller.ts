import { Request, Response } from "express";
import { z } from "zod";
import { createCompany, listCompanies } from "./company.service";

const CreateCompanySchema = z.object({
  name: z.string().min(1),
});

export async function listCompaniesHandler(_req: Request, res: Response): Promise<void> {
  const companies = await listCompanies();
  res.json(companies);
}

export async function createCompanyHandler(req: Request, res: Response): Promise<void> {
  const input = CreateCompanySchema.parse(req.body);
  const company = await createCompany(input.name);
  res.status(201).json(company);
}
