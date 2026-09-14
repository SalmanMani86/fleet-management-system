import { prisma } from "../../lib/prisma";
import { findDriverOrThrow } from "../../lib/scopedLookups";
import { InvalidStateError } from "../../lib/errors";
import { recordAuditLog } from "../auditLog/auditLog.service";

export interface CreateDriverInput {
  fullName: string;
  licenseNumber: string;
  licenseExpiry?: string;
  phone?: string;
}

export async function createDriver(companyId: string, input: CreateDriverInput) {
  return prisma.driver.create({
    data: {
      companyId,
      fullName: input.fullName,
      licenseNumber: input.licenseNumber,
      licenseExpiry: input.licenseExpiry ? new Date(input.licenseExpiry) : null,
      phone: input.phone,
    },
  });
}

export async function listDrivers(companyId: string, status?: "ACTIVE" | "INACTIVE") {
  return prisma.driver.findMany({
    where: { companyId, ...(status ? { status } : {}) },
    orderBy: { fullName: "asc" },
  });
}

export async function getDriver(companyId: string, id: string) {
  return findDriverOrThrow(prisma, companyId, id);
}

/**
 * Setting a driver INACTIVE does not touch any existing vehicle assignment
 * or trip history — those are separate, time-bounded/snapshotted records.
 * It only prevents the driver from being selected for NEW assignments or
 * trips going forward (enforced in those services via findActiveDriverOrThrow).
 */
export async function setDriverStatus(companyId: string, id: string, status: "ACTIVE" | "INACTIVE") {
  return prisma.$transaction(async (tx) => {
    const driver = await findDriverOrThrow(tx, companyId, id);
    if (driver.status === status) {
      throw new InvalidStateError(`Driver is already ${status}`);
    }

    const updated = await tx.driver.update({ where: { id }, data: { status } });

    await recordAuditLog(tx, {
      companyId,
      action: "DRIVER_STATUS_CHANGED",
      entityType: "Driver",
      entityId: id,
      beforeState: { status: driver.status },
      afterState: { status: updated.status },
    });

    return updated;
  });
}
