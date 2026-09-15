import { api } from "./client";
import type { MaintenanceRecord, MaintenanceStatus, MaintenanceStatusLog } from "../types";

export interface CreateMaintenanceRecordInput {
  vehicleId: string;
  description: string;
  scheduledDate?: string;
  odometerKm?: number;
  cost?: string | number;
}

export const maintenanceApi = {
  list: (companyId: string, vehicleId?: string) =>
    api.get<MaintenanceRecord[]>(`/companies/${companyId}/maintenance-records${vehicleId ? `?vehicleId=${vehicleId}` : ""}`),
  create: (companyId: string, input: CreateMaintenanceRecordInput) =>
    api.post<MaintenanceRecord>(`/companies/${companyId}/maintenance-records`, input),
  transitionStatus: (companyId: string, id: string, status: MaintenanceStatus, note?: string) =>
    api.post<MaintenanceRecord>(`/companies/${companyId}/maintenance-records/${id}/status`, { status, note }),
  getHistory: (companyId: string, id: string) =>
    api.get<MaintenanceStatusLog[]>(`/companies/${companyId}/maintenance-records/${id}/history`),
};
