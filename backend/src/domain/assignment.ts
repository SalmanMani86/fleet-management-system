/**
 * Pure domain logic for vehicle/driver assignment, kept free of Prisma and
 * Express so it can be unit tested without a database.
 */

export class ConflictingAssignmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictingAssignmentError";
  }
}

/**
 * A vehicle can only have one open (current) driver assignment at a time.
 * Reassigning a vehicle to a new driver must close out the previous open
 * assignment (set effectiveTo) rather than deleting or mutating it, so the
 * historical record of "who was driving this vehicle, and when" survives
 * intact for any trip that referenced the earlier driver.
 */
export function assertNoOpenAssignmentConflict(currentOpenDriverId: string | null, newDriverId: string): void {
  if (currentOpenDriverId !== null && currentOpenDriverId === newDriverId) {
    throw new ConflictingAssignmentError("Vehicle is already assigned to this driver");
  }
}
