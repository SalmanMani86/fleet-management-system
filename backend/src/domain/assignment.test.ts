import { describe, it, expect } from "vitest";
import { assertNoOpenAssignmentConflict, ConflictingAssignmentError } from "./assignment";

describe("assertNoOpenAssignmentConflict", () => {
  it("allows assigning a driver when there is no current open assignment", () => {
    expect(() => assertNoOpenAssignmentConflict(null, "driver-1")).not.toThrow();
  });

  it("allows reassigning to a different driver", () => {
    expect(() => assertNoOpenAssignmentConflict("driver-1", "driver-2")).not.toThrow();
  });

  it("rejects re-assigning the same driver that is already current", () => {
    expect(() => assertNoOpenAssignmentConflict("driver-1", "driver-1")).toThrow(ConflictingAssignmentError);
  });
});
