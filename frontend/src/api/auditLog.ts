import { api } from "./client";
import type { AuditLogEntry } from "../types";

export const auditLogApi = {
  list: (companyId: string, entityType?: string, entityId?: string) => {
    const params = new URLSearchParams();
    if (entityType) params.set("entityType", entityType);
    if (entityId) params.set("entityId", entityId);
    const qs = params.toString();
    return api.get<AuditLogEntry[]>(`/companies/${companyId}/audit-logs${qs ? `?${qs}` : ""}`);
  },
};
