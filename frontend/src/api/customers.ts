import { api } from "./client";
import type { Customer } from "../types";

export interface CreateCustomerInput {
  name: string;
  contactInfo?: string;
}

export const customersApi = {
  list: (companyId: string) => api.get<Customer[]>(`/companies/${companyId}/customers`),
  create: (companyId: string, input: CreateCustomerInput) =>
    api.post<Customer>(`/companies/${companyId}/customers`, input),
};
