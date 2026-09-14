import { prisma } from "../../lib/prisma";
import { findVehicleModelOrThrow } from "../../lib/scopedLookups";

export interface CreateVehicleModelInput {
  make: string;
  modelName: string;
  manufactureYear: number;
  capacityKg?: string | number;
}

export async function createVehicleModel(companyId: string, input: CreateVehicleModelInput) {
  return prisma.vehicleModel.create({
    data: {
      companyId,
      make: input.make,
      modelName: input.modelName,
      manufactureYear: input.manufactureYear,
      capacityKg: input.capacityKg ?? null,
    },
  });
}

export async function listVehicleModels(companyId: string) {
  return prisma.vehicleModel.findMany({ where: { companyId }, orderBy: { make: "asc" } });
}

export async function getVehicleModel(companyId: string, id: string) {
  return findVehicleModelOrThrow(prisma, companyId, id);
}
