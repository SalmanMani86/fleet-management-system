import { Request, Response } from "express";
import { z } from "zod";
import { createDriver, listDrivers, getDriver, setDriverStatus } from "./driver.service";

const CreateDriverSchema = z.object({
  fullName: z.string().min(1),
  licenseNumber: z.string().min(1),
  licenseExpiry: z.string().optional(),
  phone: z.string().optional(),
});

const SetDriverStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export async function listDriversHandler(req: Request, res: Response): Promise<void> {
  const status = req.query.status;
  res.json(await listDrivers(req.companyId, status === "ACTIVE" || status === "INACTIVE" ? status : undefined));
}

export async function createDriverHandler(req: Request, res: Response): Promise<void> {
  const input = CreateDriverSchema.parse(req.body);
  const driver = await createDriver(req.companyId, input);
  res.status(201).json(driver);
}

export async function getDriverHandler(req: Request, res: Response): Promise<void> {
  res.json(await getDriver(req.companyId, req.params.id));
}

export async function setDriverStatusHandler(req: Request, res: Response): Promise<void> {
  const input = SetDriverStatusSchema.parse(req.body);
  const driver = await setDriverStatus(req.companyId, req.params.id, input.status);
  res.json(driver);
}
