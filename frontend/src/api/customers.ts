import { api } from "./client";
import type { Customer } from "../types";

export const customersApi = {
  list: (companyId: string) => api.get<Customer[]>(`/companies/${companyId}/customers`),
  create: (companyId: string, input: { name: string; contactInfo?: string }) =>
    api.post<Customer>(`/companies/${companyId}/customers`, input),
};
