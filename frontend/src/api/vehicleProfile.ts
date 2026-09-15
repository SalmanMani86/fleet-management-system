import { api } from "./client";
import type { VehicleProfile } from "../types";

export const vehicleProfileApi = {
  get: (companyId: string, vehicleId: string) =>
    api.get<VehicleProfile>(`/companies/${companyId}/vehicle-profile/${vehicleId}`),
};
