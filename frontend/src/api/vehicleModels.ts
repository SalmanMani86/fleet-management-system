import { api } from "./client";
import type { VehicleModel } from "../types";

export const vehicleModelsApi = {
  list: (companyId: string) => api.get<VehicleModel[]>(`/companies/${companyId}/vehicle-models`),
  create: (
    companyId: string,
    input: { make: string; modelName: string; manufactureYear: number; capacityKg?: string | number }
  ) => api.post<VehicleModel>(`/companies/${companyId}/vehicle-models`, input),
};
