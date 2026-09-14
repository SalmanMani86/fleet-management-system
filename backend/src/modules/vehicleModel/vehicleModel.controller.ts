import { Request, Response } from "express";
import { z } from "zod";
import { createVehicleModel, listVehicleModels, getVehicleModel } from "./vehicleModel.service";

const CreateVehicleModelSchema = z.object({
  make: z.string().min(1),
  modelName: z.string().min(1),
  manufactureYear: z.number().int().min(1950).max(2100),
  capacityKg: z.union([z.string(), z.number()]).optional(),
});

export async function listVehicleModelsHandler(req: Request, res: Response): Promise<void> {
  res.json(await listVehicleModels(req.companyId));
}

export async function createVehicleModelHandler(req: Request, res: Response): Promise<void> {
  const input = CreateVehicleModelSchema.parse(req.body);
  const model = await createVehicleModel(req.companyId, input);
  res.status(201).json(model);
}

export async function getVehicleModelHandler(req: Request, res: Response): Promise<void> {
  res.json(await getVehicleModel(req.companyId, req.params.id));
}
