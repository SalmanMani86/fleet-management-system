import { prisma } from "../../lib/prisma";
import { findActiveVehicleOrThrow, findTrailerOrThrow } from "../../lib/scopedLookups";
import { InvalidStateError } from "../../lib/errors";
import { recordAuditLog } from "../auditLog/auditLog.service";
import { assertNoOpenAssignmentConflict } from "../../domain/assignment";

export interface AssignTrailerInput {
  vehicleId: string;
  trailerId: string;
  effectiveFrom?: string;
}

export async function assignTrailerToVehicle(companyId: string, input: AssignTrailerInput) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await findActiveVehicleOrThrow(tx, companyId, input.vehicleId);
    const trailer = await findTrailerOrThrow(tx, companyId, input.trailerId);
    if (trailer.status !== "ACTIVE") {
      throw new InvalidStateError("Trailer is inactive and cannot be assigned");
    }
    const effectiveFrom = input.effectiveFrom ? new Date(input.effectiveFrom) : new Date();

    const currentOpen = await tx.trailerAssignment.findFirst({
      where: { companyId, vehicleId: vehicle.id, effectiveTo: null },
    });

    assertNoOpenAssignmentConflict(currentOpen?.trailerId ?? null, trailer.id);

    if (currentOpen) {
      await tx.trailerAssignment.update({
        where: { id: currentOpen.id },
        data: { effectiveTo: effectiveFrom },
      });
    }

    const assignment = await tx.trailerAssignment.create({
      data: {
        companyId,
        vehicleId: vehicle.id,
        trailerId: trailer.id,
        effectiveFrom,
      },
    });

    await recordAuditLog(tx, {
      companyId,
      action: "VEHICLE_TRAILER_ASSIGNED",
      entityType: "TrailerAssignment",
      entityId: assignment.id,
      beforeState: currentOpen ? { trailerId: currentOpen.trailerId } : undefined,
      afterState: { trailerId: trailer.id, vehicleId: vehicle.id },
    });

    return assignment;
  });
}

export async function unassignTrailer(companyId: string, vehicleId: string, effectiveTo?: string) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await findActiveVehicleOrThrow(tx, companyId, vehicleId);
    const current = await tx.trailerAssignment.findFirst({
      where: { companyId, vehicleId: vehicle.id, effectiveTo: null },
    });
    if (!current) return null;

    const closedAt = effectiveTo ? new Date(effectiveTo) : new Date();
    const updated = await tx.trailerAssignment.update({
      where: { id: current.id },
      data: { effectiveTo: closedAt },
    });

    await recordAuditLog(tx, {
      companyId,
      action: "VEHICLE_TRAILER_UNASSIGNED",
      entityType: "TrailerAssignment",
      entityId: current.id,
      beforeState: { trailerId: current.trailerId },
      afterState: { effectiveTo: closedAt.toISOString() },
    });

    return updated;
  });
}

export async function getCurrentTrailerAssignment(companyId: string, vehicleId: string) {
  return prisma.trailerAssignment.findFirst({
    where: { companyId, vehicleId, effectiveTo: null },
    include: { trailer: true },
  });
}

export async function getTrailerAssignmentHistory(companyId: string, vehicleId: string) {
  return prisma.trailerAssignment.findMany({
    where: { companyId, vehicleId },
    include: { trailer: true },
    orderBy: { effectiveFrom: "desc" },
  });
}
