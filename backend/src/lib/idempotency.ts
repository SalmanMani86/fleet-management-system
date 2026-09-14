import { Prisma } from "@prisma/client";
import { ConflictError } from "./errors";

/**
 * Duplicate-request guard for trip-creating / write endpoints that accept an
 * Idempotency-Key header. Primary mechanism: the unique DB constraint on
 * (companyId, idempotencyKey) on the target table. If two requests with the
 * same key race past an application-level check simultaneously, the database
 * constraint is what actually prevents a duplicate row — this helper just
 * turns that constraint violation into a clean, typed error.
 */
export function isUniqueIdempotencyViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    (error.meta!.target as string[]).some((t) => t.includes("idempotency_key"))
  );
}

export function throwDuplicateRequestError(): never {
  throw new ConflictError("A request with this idempotency key has already been processed");
}
