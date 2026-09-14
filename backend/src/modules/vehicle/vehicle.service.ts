import { prisma } from "../../lib/prisma";
import { findVehicleOrThrow, findVehicleModelOrThrow } from "../../lib/scopedLookups";
import { InvalidStateError } from "../../lib/errors";
import { recordAuditLog } from "../auditLog/auditLog.service";

export interface CreateVehicleInput {
  vehicleModelId: string;
  vin: string;
  plateNumber: string;
  manufactureYear: number;
}

export async function createVehicle(companyId: string, input: CreateVehicleInput) {
  await findVehicleModelOrThrow(prisma, companyId, input.vehicleModelId);

  return prisma.vehicle.create({
    data: {
      companyId,
      vehicleModelId: input.vehicleModelId,
      vin: input.vin,
      plateNumber: input.plateNumber,
      manufactureYear: input.manufactureYear,
    },
  });
}

export async function listVehicles(companyId: string, status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE") {
  return prisma.vehicle.findMany({
    where: { companyId, ...(status ? { status } : {}) },
    include: { vehicleModel: true },
    orderBy: { plateNumber: "asc" },
  });
}

export async function getVehicle(companyId: string, id: string) {
  return findVehicleOrThrow(prisma, companyId, id);
}

/**
 * Vehicle.status is a plain current-value column (no history log — see the
 * Vehicle Profile task's scope decision). It is the single enforcement point
 * that keeps an inactive/in-maintenance vehicle out of new assignments and
 * trips: every service that resolves a vehicle for an operational action
 * calls findActiveVehicleOrThrow instead of findVehicleOrThrow.
 */
export async function setVehicleStatus(
  companyId: string,
  id: string,
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE"
) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await findVehicleOrThrow(tx, companyId, id);
    if (vehicle.status === status) {
      throw new InvalidStateError(`Vehicle is already ${status}`);
    }

    const updated = await tx.vehicle.update({ where: { id }, data: { status } });

    await recordAuditLog(tx, {
      companyId,
      action: "VEHICLE_STATUS_CHANGED",
      entityType: "Vehicle",
      entityId: id,
      beforeState: { status: vehicle.status },
      afterState: { status: updated.status },
    });

    return updated;
  });
}
