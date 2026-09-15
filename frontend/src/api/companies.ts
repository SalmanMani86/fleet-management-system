import { api } from "./client";
import type { Company } from "../types";

export const companiesApi = {
  list: () => api.get<Company[]>("/companies"),
  create: (input: { name: string }) => api.post<Company>("/companies", input),
};
