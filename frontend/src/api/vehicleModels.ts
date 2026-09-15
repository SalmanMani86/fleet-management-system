import { api } from "./client";
import type { VehicleModel } from "../types";

export interface CreateVehicleModelInput {
  make: string;
  modelName: string;
  manufactureYear: number;
  capacityKg?: string | number;
}

export const vehicleModelsApi = {
  list: (companyId: string) => api.get<VehicleModel[]>(`/companies/${companyId}/vehicle-models`),
  create: (companyId: string, input: CreateVehicleModelInput) =>
    api.post<VehicleModel>(`/companies/${companyId}/vehicle-models`, input),
};
