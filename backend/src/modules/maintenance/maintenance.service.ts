import { prisma } from "../../lib/prisma";
import { findVehicleOrThrow } from "../../lib/scopedLookups";
import { NotFoundError, InvalidStateError } from "../../lib/errors";
import { recordAuditLog } from "../auditLog/auditLog.service";
import { assertValidMaintenanceTransition, InvalidMaintenanceTransitionError, MaintenanceStatus } from "../../domain/maintenanceTransitions";

export interface CreateMaintenanceRecordInput {
  vehicleId: string;
  description: string;
  scheduledDate?: string;
  odometerKm?: number;
  cost?: string | number;
}

export async function createMaintenanceRecord(companyId: string, input: CreateMaintenanceRecordInput) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await findVehicleOrThrow(tx, companyId, input.vehicleId);

    const record = await tx.maintenanceRecord.create({
      data: {
        companyId,
        vehicleId: vehicle.id,
        description: input.description,
        scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
        odometerKm: input.odometerKm,
        cost: input.cost ?? null,
        status: "SCHEDULED",
      },
    });

    await tx.maintenanceStatusLog.create({
      data: {
        companyId,
        maintenanceRecordId: record.id,
        fromStatus: null,
        toStatus: "SCHEDULED",
      },
    });

    return record;
  });
}

export async function listMaintenanceRecords(companyId: string, vehicleId?: string) {
  return prisma.maintenanceRecord.findMany({
    where: { companyId, ...(vehicleId ? { vehicleId } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMaintenanceRecord(companyId: string, id: string) {
  const record = await prisma.maintenanceRecord.findFirst({ where: { id, companyId } });
  if (!record) throw new NotFoundError("Maintenance record");
  return record;
}

/**
 * Every status change is validated against the maintenance state machine and
 * written to maintenance_status_logs in the same transaction as the record
 * update — this append-only log is the auditable history the brief requires,
 * independent of (and never overwritten alongside) the record's current
 * status column.
 */
export async function transitionMaintenanceStatus(
  companyId: string,
  id: string,
  toStatus: MaintenanceStatus,
  note?: string
) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.maintenanceRecord.findFirst({ where: { id, companyId } });
    if (!record) throw new NotFoundError("Maintenance record");

    try {
      assertValidMaintenanceTransition(record.status as MaintenanceStatus, toStatus);
    } catch (err) {
      if (err instanceof InvalidMaintenanceTransitionError) {
        throw new InvalidStateError(err.message);
      }
      throw err;
    }

    const updated = await tx.maintenanceRecord.update({
      where: { id },
      data: {
        status: toStatus,
        ...(toStatus === "COMPLETED" ? { completedDate: new Date() } : {}),
      },
    });

    await tx.maintenanceStatusLog.create({
      data: {
        companyId,
        maintenanceRecordId: id,
        fromStatus: record.status,
        toStatus,
        note,
      },
    });

    await recordAuditLog(tx, {
      companyId,
      action: "MAINTENANCE_STATUS_CHANGED",
      entityType: "MaintenanceRecord",
      entityId: id,
      beforeState: { status: record.status },
      afterState: { status: updated.status },
    });

    // Vehicle enters MAINTENANCE while work is in progress, and returns to
    // ACTIVE once completed — best-effort convenience, not itself audited
    // separately since VEHICLE_STATUS_CHANGED already covers Vehicle audit.
    if (toStatus === "IN_PROGRESS") {
      await tx.vehicle.updateMany({
        where: { id: record.vehicleId, companyId, status: "ACTIVE" },
        data: { status: "MAINTENANCE" },
      });
    } else if (toStatus === "COMPLETED" || toStatus === "CANCELLED") {
      await tx.vehicle.updateMany({
        where: { id: record.vehicleId, companyId, status: "MAINTENANCE" },
        data: { status: "ACTIVE" },
      });
    }

    return updated;
  });
}

export async function getMaintenanceStatusHistory(companyId: string, maintenanceRecordId: string) {
  return prisma.maintenanceStatusLog.findMany({
    where: { companyId, maintenanceRecordId },
    orderBy: { createdAt: "asc" },
  });
}
