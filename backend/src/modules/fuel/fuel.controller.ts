import { Request, Response } from "express";
import { z } from "zod";
import { createFuelRecord, listFuelRecords } from "./fuel.service";

const CreateFuelRecordSchema = z.object({
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid().optional(),
  tripId: z.string().uuid().optional(),
  filledAt: z.string(),
  liters: z.union([z.string(), z.number()]),
  costPerLiter: z.union([z.string(), z.number()]),
  odometerKm: z.number().int().optional(),
});

export async function createFuelRecordHandler(req: Request, res: Response): Promise<void> {
  const input = CreateFuelRecordSchema.parse(req.body);
  const record = await createFuelRecord(req.companyId, input);
  res.status(201).json(record);
}

export async function listFuelRecordsHandler(req: Request, res: Response): Promise<void> {
  const vehicleId = req.query.vehicleId;
  res.json(await listFuelRecords(req.companyId, typeof vehicleId === "string" ? vehicleId : undefined));
}
