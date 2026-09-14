/**
 * Pure domain logic for maintenance status transitions, kept free of Prisma
 * so the state machine rules can be unit tested without a database.
 */

export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export class InvalidMaintenanceTransitionError extends Error {
  constructor(from: MaintenanceStatus, to: MaintenanceStatus) {
    super(`Cannot transition maintenance record from ${from} to ${to}`);
    this.name = "InvalidMaintenanceTransitionError";
  }
}

const ALLOWED_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function assertValidMaintenanceTransition(from: MaintenanceStatus, to: MaintenanceStatus): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new InvalidMaintenanceTransitionError(from, to);
  }
}
