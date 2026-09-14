import { describe, it, expect } from "vitest";
import { assertValidTripTransition, InvalidTripTransitionError } from "./tripTransitions";

describe("assertValidTripTransition", () => {
  it("allows PLANNED -> IN_PROGRESS -> COMPLETED", () => {
    expect(() => assertValidTripTransition("PLANNED", "IN_PROGRESS")).not.toThrow();
    expect(() => assertValidTripTransition("IN_PROGRESS", "COMPLETED")).not.toThrow();
  });

  it("allows cancelling a planned or in-progress trip", () => {
    expect(() => assertValidTripTransition("PLANNED", "CANCELLED")).not.toThrow();
    expect(() => assertValidTripTransition("IN_PROGRESS", "CANCELLED")).not.toThrow();
  });

  it("rejects transitions out of a terminal state", () => {
    expect(() => assertValidTripTransition("COMPLETED", "PLANNED")).toThrow(InvalidTripTransitionError);
    expect(() => assertValidTripTransition("CANCELLED", "IN_PROGRESS")).toThrow(InvalidTripTransitionError);
  });

  it("rejects skipping straight from PLANNED to COMPLETED", () => {
    expect(() => assertValidTripTransition("PLANNED", "COMPLETED")).toThrow(InvalidTripTransitionError);
  });
});
