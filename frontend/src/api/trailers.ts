import { api } from "./client";
import type { Trailer, TrailerStatus } from "../types";

export interface CreateTrailerInput {
  plateNumber: string;
  trailerType?: string;
  capacityKg?: string | number;
}

export const trailersApi = {
  list: (companyId: string, status?: TrailerStatus) =>
    api.get<Trailer[]>(`/companies/${companyId}/trailers${status ? `?status=${status}` : ""}`),
  get: (companyId: string, id: string) => api.get<Trailer>(`/companies/${companyId}/trailers/${id}`),
  create: (companyId: string, input: CreateTrailerInput) =>
    api.post<Trailer>(`/companies/${companyId}/trailers`, input),
  setStatus: (companyId: string, id: string, status: TrailerStatus) =>
    api.post<Trailer>(`/companies/${companyId}/trailers/${id}/status`, { status }),
};
