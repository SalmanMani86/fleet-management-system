import { api } from "./client";
import type { VehicleAssignment } from "../types";

export const vehicleAssignmentsApi = {
  assign: (companyId: string, input: { vehicleId: string; driverId: string; effectiveFrom?: string }) =>
    api.post<VehicleAssignment>(`/companies/${companyId}/vehicle-assignments`, input),
  unassign: (companyId: string, vehicleId: string) =>
    api.post<VehicleAssignment | null>(`/companies/${companyId}/vehicle-assignments/${vehicleId}/unassign`, {}),
  getCurrent: (companyId: string, vehicleId: string) =>
    api.get<VehicleAssignment | null>(`/companies/${companyId}/vehicle-assignments/${vehicleId}/current`),
  getHistory: (companyId: string, vehicleId: string) =>
    api.get<VehicleAssignment[]>(`/companies/${companyId}/vehicle-assignments/${vehicleId}/history`),
};
