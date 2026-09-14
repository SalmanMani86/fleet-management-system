import { Request, Response } from "express";
import { z } from "zod";
import { createVehicle, listVehicles, getVehicle, setVehicleStatus } from "./vehicle.service";

const CreateVehicleSchema = z.object({
  vehicleModelId: z.string().uuid(),
  vin: z.string().min(1),
  plateNumber: z.string().min(1),
  manufactureYear: z.number().int().min(1950).max(2100),
});

const SetVehicleStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]),
});

const VEHICLE_STATUSES = ["ACTIVE", "INACTIVE", "MAINTENANCE"] as const;

export async function listVehiclesHandler(req: Request, res: Response): Promise<void> {
  const status = req.query.status;
  const parsedStatus = VEHICLE_STATUSES.find((s) => s === status);
  res.json(await listVehicles(req.companyId, parsedStatus));
}

export async function createVehicleHandler(req: Request, res: Response): Promise<void> {
  const input = CreateVehicleSchema.parse(req.body);
  const vehicle = await createVehicle(req.companyId, input);
  res.status(201).json(vehicle);
}

export async function getVehicleHandler(req: Request, res: Response): Promise<void> {
  res.json(await getVehicle(req.companyId, req.params.id));
}

export async function setVehicleStatusHandler(req: Request, res: Response): Promise<void> {
  const input = SetVehicleStatusSchema.parse(req.body);
  const vehicle = await setVehicleStatus(req.companyId, req.params.id, input.status);
  res.json(vehicle);
}
