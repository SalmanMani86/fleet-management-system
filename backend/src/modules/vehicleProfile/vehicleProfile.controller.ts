import { Request, Response } from "express";
import { getVehicleProfile } from "./vehicleProfile.service";

export async function getVehicleProfileHandler(req: Request, res: Response): Promise<void> {
  res.json(await getVehicleProfile(req.companyId, req.params.vehicleId));
}
