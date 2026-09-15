import { api } from "./client";
import type { TrailerAssignment } from "../types";

export const trailerAssignmentsApi = {
  assign: (companyId: string, input: { vehicleId: string; trailerId: string; effectiveFrom?: string }) =>
    api.post<TrailerAssignment>(`/companies/${companyId}/trailer-assignments`, input),
  unassign: (companyId: string, vehicleId: string) =>
    api.post<TrailerAssignment | null>(`/companies/${companyId}/trailer-assignments/${vehicleId}/unassign`, {}),
  getCurrent: (companyId: string, vehicleId: string) =>
    api.get<TrailerAssignment | null>(`/companies/${companyId}/trailer-assignments/${vehicleId}/current`),
  getHistory: (companyId: string, vehicleId: string) =>
    api.get<TrailerAssignment[]>(`/companies/${companyId}/trailer-assignments/${vehicleId}/history`),
};
