import { Request, Response } from "express";
import { z } from "zod";
import {
  assignDriverToVehicle,
  unassignVehicle,
  getCurrentAssignment,
  getAssignmentHistory,
} from "./vehicleAssignment.service";

const AssignDriverSchema = z.object({
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  effectiveFrom: z.string().optional(),
});

const UnassignSchema = z.object({
  effectiveTo: z.string().optional(),
});

export async function assignDriverHandler(req: Request, res: Response): Promise<void> {
  const input = AssignDriverSchema.parse(req.body);
  const assignment = await assignDriverToVehicle(req.companyId, input);
  res.status(201).json(assignment);
}

export async function unassignVehicleHandler(req: Request, res: Response): Promise<void> {
  const input = UnassignSchema.parse(req.body ?? {});
  const result = await unassignVehicle(req.companyId, req.params.vehicleId, input.effectiveTo);
  res.json(result);
}

export async function getCurrentAssignmentHandler(req: Request, res: Response): Promise<void> {
  res.json(await getCurrentAssignment(req.companyId, req.params.vehicleId));
}

export async function getAssignmentHistoryHandler(req: Request, res: Response): Promise<void> {
  res.json(await getAssignmentHistory(req.companyId, req.params.vehicleId));
}
