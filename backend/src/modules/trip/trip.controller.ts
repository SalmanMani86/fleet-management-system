import { Request, Response } from "express";
import { z } from "zod";
import { createTrip, listTrips, getTrip, transitionTripStatus, setTripAmount } from "./trip.service";
import { NotFoundError } from "../../lib/errors";

const CreateTripSchema = z.object({
  vehicleId: z.string().uuid(),
  customerId: z.string().uuid(),
  loadingPoint: z.string().optional(),
  deliveryPoint: z.string().optional(),
  scheduledAt: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
});

const TransitionStatusSchema = z.object({
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

const SetAmountSchema = z.object({
  amount: z.union([z.string(), z.number()]),
});

export async function createTripHandler(req: Request, res: Response): Promise<void> {
  const input = CreateTripSchema.parse(req.body);
  const idempotencyKey = (req.header("Idempotency-Key") ?? undefined) as string | undefined;
  const trip = await createTrip(req.companyId, { ...input, idempotencyKey });
  res.status(201).json(trip);
}

export async function listTripsHandler(req: Request, res: Response): Promise<void> {
  const vehicleId = req.query.vehicleId;
  res.json(await listTrips(req.companyId, typeof vehicleId === "string" ? vehicleId : undefined));
}

export async function getTripHandler(req: Request, res: Response): Promise<void> {
  const trip = await getTrip(req.companyId, req.params.id);
  if (!trip) throw new NotFoundError("Trip");
  res.json(trip);
}

export async function transitionTripStatusHandler(req: Request, res: Response): Promise<void> {
  const input = TransitionStatusSchema.parse(req.body);
  const trip = await transitionTripStatus(req.companyId, req.params.id, input.status);
  res.json(trip);
}

export async function setTripAmountHandler(req: Request, res: Response): Promise<void> {
  const input = SetAmountSchema.parse(req.body);
  const trip = await setTripAmount(req.companyId, req.params.id, input.amount);
  res.json(trip);
}
