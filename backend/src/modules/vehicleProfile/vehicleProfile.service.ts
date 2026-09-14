import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../lib/prisma";
import { findVehicleOrThrow } from "../../lib/scopedLookups";

/**
 * Aggregates everything the assessment brief's "Vehicle Profile" task asks
 * for into a single read model: identity, current driver/trailer (read from
 * the open assignment row, never a cached column), documents with expiry,
 * maintenance history, fuel records, trip history, operational status, and
 * total vehicle-related costs (maintenance + fuel, summed server-side from
 * Decimal fields rather than trusting any client-computed total).
 */
export async function getVehicleProfile(companyId: string, vehicleId: string) {
  const vehicle = await findVehicleOrThrow(prisma, companyId, vehicleId);

  const [vehicleModel, currentAssignment, currentTrailerAssignment, documents, maintenanceRecords, fuelRecords, trips] =
    await Promise.all([
      prisma.vehicleModel.findUnique({ where: { id: vehicle.vehicleModelId } }),
      prisma.vehicleAssignment.findFirst({
        where: { companyId, vehicleId, effectiveTo: null },
        include: { driver: true },
      }),
      prisma.trailerAssignment.findFirst({
        where: { companyId, vehicleId, effectiveTo: null },
        include: { trailer: true },
      }),
      prisma.vehicleDocument.findMany({ where: { companyId, vehicleId }, orderBy: { expiryDate: "asc" } }),
      prisma.maintenanceRecord.findMany({ where: { companyId, vehicleId }, orderBy: { createdAt: "desc" } }),
      prisma.fuelRecord.findMany({ where: { companyId, vehicleId }, orderBy: { filledAt: "desc" } }),
      prisma.trip.findMany({
        where: { companyId, vehicleId },
        include: { driver: true, trailer: true, customer: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const maintenanceCost = maintenanceRecords.reduce(
    (sum, m) => sum.plus(m.cost ?? new Decimal(0)),
    new Decimal(0)
  );
  const fuelCost = fuelRecords.reduce((sum, f) => sum.plus(f.totalCost), new Decimal(0));
  const totalCost = maintenanceCost.plus(fuelCost);

  const now = new Date();
  const expiringDocuments = documents.filter((d) => d.expiryDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));

  return {
    vehicle,
    vehicleModel,
    currentDriver: currentAssignment?.driver ?? null,
    currentTrailer: currentTrailerAssignment?.trailer ?? null,
    documents,
    expiringDocuments,
    maintenanceRecords,
    fuelRecords,
    trips,
    costs: {
      maintenanceCost: maintenanceCost.toFixed(2),
      fuelCost: fuelCost.toFixed(2),
      totalCost: totalCost.toFixed(2),
    },
  };
}
