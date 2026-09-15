import { api } from "./client";
import type { Vehicle, VehicleStatus } from "../types";

export interface CreateVehicleInput {
  vehicleModelId: string;
  vin: string;
  plateNumber: string;
  manufactureYear: number;
}

export const vehiclesApi = {
  list: (companyId: string, status?: VehicleStatus) =>
    api.get<Vehicle[]>(`/companies/${companyId}/vehicles${status ? `?status=${status}` : ""}`),
  get: (companyId: string, id: string) => api.get<Vehicle>(`/companies/${companyId}/vehicles/${id}`),
  create: (companyId: string, input: CreateVehicleInput) => api.post<Vehicle>(`/companies/${companyId}/vehicles`, input),
  setStatus: (companyId: string, id: string, status: VehicleStatus) =>
    api.post<Vehicle>(`/companies/${companyId}/vehicles/${id}/status`, { status }),
};
