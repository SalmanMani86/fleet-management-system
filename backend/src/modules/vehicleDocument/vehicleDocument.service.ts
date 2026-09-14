import { prisma } from "../../lib/prisma";
import { findVehicleOrThrow } from "../../lib/scopedLookups";
import { NotFoundError } from "../../lib/errors";

export type DocumentType = "REGISTRATION" | "INSURANCE" | "INSPECTION" | "PERMIT" | "OTHER";

export interface CreateVehicleDocumentInput {
  vehicleId: string;
  documentType: DocumentType;
  documentNumber?: string;
  issuedDate?: string;
  expiryDate: string;
  fileUrl?: string;
}

export async function createVehicleDocument(companyId: string, input: CreateVehicleDocumentInput) {
  await findVehicleOrThrow(prisma, companyId, input.vehicleId);

  return prisma.vehicleDocument.create({
    data: {
      companyId,
      vehicleId: input.vehicleId,
      documentType: input.documentType,
      documentNumber: input.documentNumber,
      issuedDate: input.issuedDate ? new Date(input.issuedDate) : null,
      expiryDate: new Date(input.expiryDate),
      fileUrl: input.fileUrl,
    },
  });
}

export async function listVehicleDocuments(companyId: string, vehicleId: string) {
  return prisma.vehicleDocument.findMany({
    where: { companyId, vehicleId },
    orderBy: { expiryDate: "asc" },
  });
}

export async function getVehicleDocument(companyId: string, id: string) {
  const doc = await prisma.vehicleDocument.findFirst({ where: { id, companyId } });
  if (!doc) throw new NotFoundError("Vehicle document");
  return doc;
}

/**
 * Documents expiring within `withinDays` (inclusive) of now, or already
 * expired. This is the query the "alerts for expiring documents" requirement
 * maps to — a simple threshold scan rather than a separate alerts/queue
 * table, since alerts here are always computed fresh from expiryDate, not a
 * stored, potentially-stale notification record.
 */
export async function listExpiringDocuments(companyId: string, withinDays: number) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + withinDays);

  return prisma.vehicleDocument.findMany({
    where: { companyId, expiryDate: { lte: threshold } },
    include: { vehicle: true },
    orderBy: { expiryDate: "asc" },
  });
}
