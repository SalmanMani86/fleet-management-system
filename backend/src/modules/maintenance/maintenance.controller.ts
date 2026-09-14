import { Request, Response } from "express";
import { z } from "zod";
import {
  createMaintenanceRecord,
  listMaintenanceRecords,
  getMaintenanceRecord,
  transitionMaintenanceStatus,
  getMaintenanceStatusHistory,
} from "./maintenance.service";

const CreateMaintenanceRecordSchema = z.object({
  vehicleId: z.string().uuid(),
  description: z.string().min(1),
  scheduledDate: z.string().optional(),
  odometerKm: z.number().int().optional(),
  cost: z.union([z.string(), z.number()]).optional(),
});

const TransitionStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  note: z.string().optional(),
});

export async function createMaintenanceRecordHandler(req: Request, res: Response): Promise<void> {
  const input = CreateMaintenanceRecordSchema.parse(req.body);
  const record = await createMaintenanceRecord(req.companyId, input);
  res.status(201).json(record);
}

export async function listMaintenanceRecordsHandler(req: Request, res: Response): Promise<void> {
  const vehicleId = req.query.vehicleId;
  res.json(await listMaintenanceRecords(req.companyId, typeof vehicleId === "string" ? vehicleId : undefined));
}

export async function getMaintenanceRecordHandler(req: Request, res: Response): Promise<void> {
  res.json(await getMaintenanceRecord(req.companyId, req.params.id));
}

export async function transitionMaintenanceStatusHandler(req: Request, res: Response): Promise<void> {
  const input = TransitionStatusSchema.parse(req.body);
  const record = await transitionMaintenanceStatus(req.companyId, req.params.id, input.status, input.note);
  res.json(record);
}

export async function getMaintenanceStatusHistoryHandler(req: Request, res: Response): Promise<void> {
  res.json(await getMaintenanceStatusHistory(req.companyId, req.params.id));
}
