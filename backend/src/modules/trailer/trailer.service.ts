import { prisma } from "../../lib/prisma";
import { findTrailerOrThrow } from "../../lib/scopedLookups";
import { InvalidStateError } from "../../lib/errors";
import { recordAuditLog } from "../auditLog/auditLog.service";

export interface CreateTrailerInput {
  plateNumber: string;
  trailerType?: string;
  capacityKg?: string | number;
}

export async function createTrailer(companyId: string, input: CreateTrailerInput) {
  return prisma.trailer.create({
    data: {
      companyId,
      plateNumber: input.plateNumber,
      trailerType: input.trailerType,
      capacityKg: input.capacityKg ?? null,
    },
  });
}

export async function listTrailers(companyId: string, status?: "ACTIVE" | "INACTIVE") {
  return prisma.trailer.findMany({
    where: { companyId, ...(status ? { status } : {}) },
    orderBy: { plateNumber: "asc" },
  });
}

export async function getTrailer(companyId: string, id: string) {
  return findTrailerOrThrow(prisma, companyId, id);
}

export async function setTrailerStatus(companyId: string, id: string, status: "ACTIVE" | "INACTIVE") {
  return prisma.$transaction(async (tx) => {
    const trailer = await findTrailerOrThrow(tx, companyId, id);
    if (trailer.status === status) {
      throw new InvalidStateError(`Trailer is already ${status}`);
    }

    const updated = await tx.trailer.update({ where: { id }, data: { status } });

    await recordAuditLog(tx, {
      companyId,
      action: "TRAILER_STATUS_CHANGED",
      entityType: "Trailer",
      entityId: id,
      beforeState: { status: trailer.status },
      afterState: { status: updated.status },
    });

    return updated;
  });
}
