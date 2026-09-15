import { api } from "./client";
import type { FuelRecord } from "../types";

export const fuelApi = {
  list: (companyId: string, vehicleId?: string) =>
    api.get<FuelRecord[]>(`/companies/${companyId}/fuel-records${vehicleId ? `?vehicleId=${vehicleId}` : ""}`),
  create: (
    companyId: string,
    input: {
      vehicleId: string;
      driverId?: string;
      tripId?: string;
      filledAt: string;
      liters: string | number;
      costPerLiter: string | number;
      odometerKm?: number;
    }
  ) => api.post<FuelRecord>(`/companies/${companyId}/fuel-records`, input),
};
