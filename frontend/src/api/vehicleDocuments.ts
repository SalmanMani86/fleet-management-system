import { api } from "./client";
import type { DocumentType, VehicleDocument } from "../types";

export const vehicleDocumentsApi = {
  listForVehicle: (companyId: string, vehicleId: string) =>
    api.get<VehicleDocument[]>(`/companies/${companyId}/vehicle-documents/vehicle/${vehicleId}`),
  listExpiring: (companyId: string, withinDays = 30) =>
    api.get<VehicleDocument[]>(`/companies/${companyId}/vehicle-documents/expiring?withinDays=${withinDays}`),
  create: (
    companyId: string,
    input: {
      vehicleId: string;
      documentType: DocumentType;
      documentNumber?: string;
      issuedDate?: string;
      expiryDate: string;
      fileUrl?: string;
    }
  ) => api.post<VehicleDocument>(`/companies/${companyId}/vehicle-documents`, input),
};
