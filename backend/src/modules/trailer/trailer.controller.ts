import { Request, Response } from "express";
import { z } from "zod";
import { createTrailer, listTrailers, getTrailer, setTrailerStatus } from "./trailer.service";

const CreateTrailerSchema = z.object({
  plateNumber: z.string().min(1),
  trailerType: z.string().optional(),
  capacityKg: z.union([z.string(), z.number()]).optional(),
});

const SetTrailerStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export async function listTrailersHandler(req: Request, res: Response): Promise<void> {
  const status = req.query.status;
  res.json(await listTrailers(req.companyId, status === "ACTIVE" || status === "INACTIVE" ? status : undefined));
}

export async function createTrailerHandler(req: Request, res: Response): Promise<void> {
  const input = CreateTrailerSchema.parse(req.body);
  const trailer = await createTrailer(req.companyId, input);
  res.status(201).json(trailer);
}

export async function getTrailerHandler(req: Request, res: Response): Promise<void> {
  res.json(await getTrailer(req.companyId, req.params.id));
}

export async function setTrailerStatusHandler(req: Request, res: Response): Promise<void> {
  const input = SetTrailerStatusSchema.parse(req.body);
  const trailer = await setTrailerStatus(req.companyId, req.params.id, input.status);
  res.json(trailer);
}
