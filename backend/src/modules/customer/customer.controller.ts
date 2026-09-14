import { Request, Response } from "express";
import { z } from "zod";
import { createCustomer, listCustomers, getCustomer } from "./customer.service";

const CreateCustomerSchema = z.object({
  name: z.string().min(1),
  contactInfo: z.string().optional(),
});

export async function listCustomersHandler(req: Request, res: Response): Promise<void> {
  res.json(await listCustomers(req.companyId));
}

export async function createCustomerHandler(req: Request, res: Response): Promise<void> {
  const input = CreateCustomerSchema.parse(req.body);
  const customer = await createCustomer(req.companyId, input);
  res.status(201).json(customer);
}

export async function getCustomerHandler(req: Request, res: Response): Promise<void> {
  res.json(await getCustomer(req.companyId, req.params.id));
}
