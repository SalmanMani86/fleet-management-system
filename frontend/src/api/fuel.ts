import { api } from "./client";
import type { FuelRecord } from "../types";

export interface CreateFuelRecordInput {
  vehicleId: string;
  driverId?: string;
  tripId?: string;
  filledAt: string;
  liters: string | number;
  costPerLiter: string | number;
  odometerKm?: number;
}

export const fuelApi = {
  list: (companyId: string, vehicleId?: string) =>
    api.get<FuelRecord[]>(`/companies/${companyId}/fuel-records${vehicleId ? `?vehicleId=${vehicleId}` : ""}`),
  create: (companyId: string, input: CreateFuelRecordInput) =>
    api.post<FuelRecord>(`/companies/${companyId}/fuel-records`, input),
};
