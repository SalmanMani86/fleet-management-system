import { api, genIdempotencyKey } from "./client";
import type { Trip, TripStatus } from "../types";

export const tripsApi = {
  list: (companyId: string, vehicleId?: string) =>
    api.get<Trip[]>(`/companies/${companyId}/trips${vehicleId ? `?vehicleId=${vehicleId}` : ""}`),
  get: (companyId: string, id: string) => api.get<Trip>(`/companies/${companyId}/trips/${id}`),
  create: (
    companyId: string,
    input: {
      vehicleId: string;
      customerId: string;
      loadingPoint: string;
      deliveryPoint: string;
      scheduledAt?: string;
      amount?: string | number;
    }
  ) => api.post<Trip>(`/companies/${companyId}/trips`, input, genIdempotencyKey()),
  transitionStatus: (companyId: string, id: string, status: TripStatus) =>
    api.post<Trip>(`/companies/${companyId}/trips/${id}/status`, { status }),
  setAmount: (companyId: string, id: string, amount: string | number) =>
    api.post<Trip>(`/companies/${companyId}/trips/${id}/amount`, { amount }),
};
