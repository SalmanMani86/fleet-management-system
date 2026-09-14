/**
 * Pure domain logic for trip status transitions, kept free of Prisma so the
 * state machine rules can be unit tested without a database.
 */

export type TripStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export class InvalidTripTransitionError extends Error {
  constructor(from: TripStatus, to: TripStatus) {
    super(`Cannot transition trip from ${from} to ${to}`);
    this.name = "InvalidTripTransitionError";
  }
}

const ALLOWED_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  PLANNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function assertValidTripTransition(from: TripStatus, to: TripStatus): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new InvalidTripTransitionError(from, to);
  }
}
