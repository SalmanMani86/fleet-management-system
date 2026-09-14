import { prisma } from "../../lib/prisma";
import { findActiveVehicleOrThrow, findActiveDriverOrThrow } from "../../lib/scopedLookups";
import { recordAuditLog } from "../auditLog/auditLog.service";
import { assertNoOpenAssignmentConflict } from "../../domain/assignment";

export interface AssignDriverInput {
  vehicleId: string;
  driverId: string;
  effectiveFrom?: string;
}

/**
 * The single source of truth for "who is currently driving this vehicle" is
 * the vehicle_assignments row for that vehicle with effectiveTo = null —
 * never a mutable column on Vehicle. Reassignment is a transaction that (1)
 * closes the currently open assignment, if any, by stamping its effectiveTo,
 * and (2) opens a new one. Both steps commit together or not at all, so the
 * vehicle is never left with zero or multiple open assignments.
 *
 * The DB also enforces "at most one open assignment per vehicle" via a
 * partial unique index on (vehicle_id) WHERE effective_to IS NULL, as a
 * backstop against a race between two concurrent reassignment requests.
 */
export async function assignDriverToVehicle(companyId: string, input: AssignDriverInput) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await findActiveVehicleOrThrow(tx, companyId, input.vehicleId);
    const driver = await findActiveDriverOrThrow(tx, companyId, input.driverId);
    const effectiveFrom = input.effectiveFrom ? new Date(input.effectiveFrom) : new Date();

    const currentOpen = await tx.vehicleAssignment.findFirst({
      where: { companyId, vehicleId: vehicle.id, effectiveTo: null },
    });

    assertNoOpenAssignmentConflict(currentOpen?.driverId ?? null, driver.id);

    if (currentOpen) {
      await tx.vehicleAssignment.update({
        where: { id: currentOpen.id },
        data: { effectiveTo: effectiveFrom },
      });
    }

    const assignment = await tx.vehicleAssignment.create({
      data: {
        companyId,
        vehicleId: vehicle.id,
        driverId: driver.id,
        effectiveFrom,
      },
    });

    await recordAuditLog(tx, {
      companyId,
      action: "VEHICLE_DRIVER_ASSIGNED",
      entityType: "VehicleAssignment",
      entityId: assignment.id,
      beforeState: currentOpen ? { driverId: currentOpen.driverId } : undefined,
      afterState: { driverId: driver.id, vehicleId: vehicle.id },
    });

    return assignment;
  });
}

/**
 * Ends the current open assignment for a vehicle without starting a new one
 * (e.g. the vehicle is being taken out of service). The vehicle is left with
 * no open assignment, which trip creation must treat as "no driver resolved".
 */
export async function unassignVehicle(companyId: string, vehicleId: string, effectiveTo?: string) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await findActiveVehicleOrThrow(tx, companyId, vehicleId);
    const current = await tx.vehicleAssignment.findFirst({
      where: { companyId, vehicleId: vehicle.id, effectiveTo: null },
    });
    if (!current) return null;

    const closedAt = effectiveTo ? new Date(effectiveTo) : new Date();
    const updated = await tx.vehicleAssignment.update({
      where: { id: current.id },
      data: { effectiveTo: closedAt },
    });

    await recordAuditLog(tx, {
      companyId,
      action: "VEHICLE_DRIVER_UNASSIGNED",
      entityType: "VehicleAssignment",
      entityId: current.id,
      beforeState: { driverId: current.driverId },
      afterState: { effectiveTo: closedAt.toISOString() },
    });

    return updated;
  });
}

export async function getCurrentAssignment(companyId: string, vehicleId: string) {
  return prisma.vehicleAssignment.findFirst({
    where: { companyId, vehicleId, effectiveTo: null },
    include: { driver: true },
  });
}

export async function getAssignmentHistory(companyId: string, vehicleId: string) {
  return prisma.vehicleAssignment.findMany({
    where: { companyId, vehicleId },
    include: { driver: true },
    orderBy: { effectiveFrom: "desc" },
  });
}
