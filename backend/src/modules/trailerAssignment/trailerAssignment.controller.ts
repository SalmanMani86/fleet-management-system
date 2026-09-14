import { Request, Response } from "express";
import { z } from "zod";
import {
  assignTrailerToVehicle,
  unassignTrailer,
  getCurrentTrailerAssignment,
  getTrailerAssignmentHistory,
} from "./trailerAssignment.service";

const AssignTrailerSchema = z.object({
  vehicleId: z.string().uuid(),
  trailerId: z.string().uuid(),
  effectiveFrom: z.string().optional(),
});

const UnassignSchema = z.object({
  effectiveTo: z.string().optional(),
});

export async function assignTrailerHandler(req: Request, res: Response): Promise<void> {
  const input = AssignTrailerSchema.parse(req.body);
  const assignment = await assignTrailerToVehicle(req.companyId, input);
  res.status(201).json(assignment);
}

export async function unassignTrailerHandler(req: Request, res: Response): Promise<void> {
  const input = UnassignSchema.parse(req.body ?? {});
  const result = await unassignTrailer(req.companyId, req.params.vehicleId, input.effectiveTo);
  res.json(result);
}

export async function getCurrentTrailerAssignmentHandler(req: Request, res: Response): Promise<void> {
  res.json(await getCurrentTrailerAssignment(req.companyId, req.params.vehicleId));
}

export async function getTrailerAssignmentHistoryHandler(req: Request, res: Response): Promise<void> {
  res.json(await getTrailerAssignmentHistory(req.companyId, req.params.vehicleId));
}
