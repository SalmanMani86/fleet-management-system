import { describe, it, expect } from "vitest";
import { assertValidMaintenanceTransition, InvalidMaintenanceTransitionError } from "./maintenanceTransitions";

describe("assertValidMaintenanceTransition", () => {
  it("allows SCHEDULED -> IN_PROGRESS -> COMPLETED", () => {
    expect(() => assertValidMaintenanceTransition("SCHEDULED", "IN_PROGRESS")).not.toThrow();
    expect(() => assertValidMaintenanceTransition("IN_PROGRESS", "COMPLETED")).not.toThrow();
  });

  it("allows cancelling from SCHEDULED or IN_PROGRESS", () => {
    expect(() => assertValidMaintenanceTransition("SCHEDULED", "CANCELLED")).not.toThrow();
    expect(() => assertValidMaintenanceTransition("IN_PROGRESS", "CANCELLED")).not.toThrow();
  });

  it("rejects transitions out of a terminal state", () => {
    expect(() => assertValidMaintenanceTransition("COMPLETED", "IN_PROGRESS")).toThrow(
      InvalidMaintenanceTransitionError
    );
    expect(() => assertValidMaintenanceTransition("CANCELLED", "SCHEDULED")).toThrow(
      InvalidMaintenanceTransitionError
    );
  });

  it("rejects skipping straight from SCHEDULED to COMPLETED", () => {
    expect(() => assertValidMaintenanceTransition("SCHEDULED", "COMPLETED")).toThrow(
      InvalidMaintenanceTransitionError
    );
  });
});
