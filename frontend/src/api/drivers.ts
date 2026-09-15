import { api } from "./client";
import type { Driver, DriverStatus } from "../types";

export const driversApi = {
  list: (companyId: string, status?: DriverStatus) =>
    api.get<Driver[]>(`/companies/${companyId}/drivers${status ? `?status=${status}` : ""}`),
  get: (companyId: string, id: string) => api.get<Driver>(`/companies/${companyId}/drivers/${id}`),
  create: (companyId: string, input: { fullName: string; licenseNumber: string; licenseExpiry?: string; phone?: string }) =>
    api.post<Driver>(`/companies/${companyId}/drivers`, input),
  setStatus: (companyId: string, id: string, status: DriverStatus) =>
    api.post<Driver>(`/companies/${companyId}/drivers/${id}/status`, { status }),
};
