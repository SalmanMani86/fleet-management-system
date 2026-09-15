import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../lib/prisma";
import { findActiveVehicleOrThrow, findCustomerOrThrow, findTripOrThrow } from "../../lib/scopedLookups";
import { InvalidStateError, ValidationFailedError } from "../../lib/errors";
import { recordAuditLog } from "../auditLog/auditLog.service";
import { isUniqueIdempotencyViolation, throwDuplicateRequestError } from "../../lib/idempotency";
import { assertValidTripTransition, InvalidTripTransitionError, TripStatus } from "../../domain/tripTransitions";

export interface CreateTripInput {
  vehicleId: string;
  customerId: string;
  loadingPoint: string;
  deliveryPoint: string;
  scheduledAt?: string;
  amount?: string | number;
  idempotencyKey?: string;
}

/**
 * Trip creation resolves the driver (and trailer, if any) from the vehicle's
 * CURRENT open assignment at the moment of creation, and stores them as a
 * plain snapshot on the Trip row (driverId, trailerId columns) — never as a
 * live lookup through vehicle_assignments. This is what makes the Integration
 * Test scenario work: if the vehicle is later reassigned to a different
 * driver, this trip's driverId is untouched, because it was copied, not
 * referenced. The vehicle must also be ACTIVE and have an open driver
 * assignment, or trip creation is refused outright.
 *
 * A vehicle can have at most one open trip (PLANNED or IN_PROGRESS) at a
 * time — a single truck cannot physically run two deliveries at once — so
 * creation is also refused if the vehicle already has one in flight.
 */
export async function createTrip(companyId: string, input: CreateTripInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const vehicle = await findActiveVehicleOrThrow(tx, companyId, input.vehicleId);
      const customer = await findCustomerOrThrow(tx, companyId, input.customerId);

      const currentDriverAssignment = await tx.vehicleAssignment.findFirst({
        where: { companyId, vehicleId: vehicle.id, effectiveTo: null },
      });
      if (!currentDriverAssignment) {
        throw new InvalidStateError("Vehicle has no current driver assignment; assign a driver before creating a trip");
      }

      const openTrip = await tx.trip.findFirst({
        where: { companyId, vehicleId: vehicle.id, status: { in: ["PLANNED", "IN_PROGRESS"] } },
      });
      if (openTrip) {
        throw new InvalidStateError(
          `Vehicle already has an open trip (${openTrip.status}); complete or cancel it before creating a new one`
        );
      }

      const currentTrailerAssignment = await tx.trailerAssignment.findFirst({
        where: { companyId, vehicleId: vehicle.id, effectiveTo: null },
      });

      const trip = await tx.trip.create({
        data: {
          companyId,
          vehicleId: vehicle.id,
          driverId: currentDriverAssignment.driverId,
          trailerId: currentTrailerAssignment?.trailerId,
          customerId: customer.id,
          loadingPoint: input.loadingPoint,
          deliveryPoint: input.deliveryPoint,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          amount: input.amount ?? null,
          status: "PLANNED",
          idempotencyKey: input.idempotencyKey,
        },
      });

      await recordAuditLog(tx, {
        companyId,
        action: "TRIP_CREATED",
        entityType: "Trip",
        entityId: trip.id,
        afterState: { vehicleId: vehicle.id, driverId: trip.driverId, trailerId: trip.trailerId },
      });

      return trip;
    });
  } catch (error) {
    if (isUniqueIdempotencyViolation(error)) throwDuplicateRequestError();
    throw error;
  }
}

export async function listTrips(companyId: string, vehicleId?: string) {
  return prisma.trip.findMany({
    where: { companyId, ...(vehicleId ? { vehicleId } : {}) },
    include: { driver: true, trailer: true, customer: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTrip(companyId: string, id: string) {
  return prisma.trip.findFirst({
    where: { id, companyId },
    include: { driver: true, trailer: true, customer: true, vehicle: true },
  });
}

/**
 * Advances a trip through its status state machine. Completing a trip does
 * not re-resolve driver/vehicle/trailer — those were fixed at creation and
 * must remain exactly as they were, per the Integration Test requirement
 * that "completed trips must retain their original driver/vehicle
 * relationship" even if the vehicle has since been reassigned.
 */
export async function transitionTripStatus(companyId: string, id: string, toStatus: TripStatus) {
  return prisma.$transaction(async (tx) => {
    const trip = await findTripOrThrow(tx, companyId, id);

    try {
      assertValidTripTransition(trip.status as TripStatus, toStatus);
    } catch (err) {
      if (err instanceof InvalidTripTransitionError) {
        throw new InvalidStateError(err.message);
      }
      throw err;
    }

    if (toStatus === "COMPLETED" && (trip.amount === null || new Decimal(trip.amount).lessThanOrEqualTo(0))) {
      throw new ValidationFailedError("Trip must have a positive amount before it can be completed");
    }

    const updated = await tx.trip.update({
      where: { id },
      data: {
        status: toStatus,
        ...(toStatus === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
    });

    await recordAuditLog(tx, {
      companyId,
      action: "TRIP_STATUS_CHANGED",
      entityType: "Trip",
      entityId: id,
      beforeState: { status: trip.status },
      afterState: { status: updated.status },
    });

    return updated;
  });
}

export async function setTripAmount(companyId: string, id: string, amount: string | number) {
  return prisma.$transaction(async (tx) => {
    const trip = await findTripOrThrow(tx, companyId, id);
    if (trip.status !== "PLANNED" && trip.status !== "IN_PROGRESS") {
      throw new InvalidStateError("Trip amount can only be set while the trip is PLANNED or IN_PROGRESS");
    }

    const decimalAmount = new Decimal(amount).toDecimalPlaces(2);
    if (decimalAmount.lessThanOrEqualTo(0)) {
      throw new ValidationFailedError("amount must be greater than zero");
    }

    return tx.trip.update({ where: { id }, data: { amount: decimalAmount } });
  });
}
