import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../lib/prisma";
import { findVehicleOrThrow, findDriverOrThrow, findTripOrThrow } from "../../lib/scopedLookups";
import { ValidationFailedError } from "../../lib/errors";

export interface CreateFuelRecordInput {
  vehicleId: string;
  driverId?: string;
  tripId?: string;
  filledAt: string;
  liters: string | number;
  costPerLiter: string | number;
  odometerKm?: number;
}

/**
 * When tripId is supplied, driverId is derived and LOCKED from the trip's
 * own snapshotted driver — the client-supplied driverId (if any) is ignored
 * rather than trusted, so a fuel record can never contradict the driver of
 * the trip it is linked to. driverId is only taken from client input when
 * there is no trip context (e.g. depot fueling with no associated trip).
 */
export async function createFuelRecord(companyId: string, input: CreateFuelRecordInput) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await findVehicleOrThrow(tx, companyId, input.vehicleId);

    let driverId = input.driverId;
    if (input.tripId) {
      const trip = await findTripOrThrow(tx, companyId, input.tripId);
      if (trip.vehicleId !== vehicle.id) {
        throw new ValidationFailedError("Fuel record's vehicle does not match the linked trip's vehicle");
      }
      driverId = trip.driverId;
    }

    if (!driverId) {
      throw new ValidationFailedError("driverId is required when the fuel record is not linked to a trip");
    }
    await findDriverOrThrow(tx, companyId, driverId);

    const liters = new Decimal(input.liters).toDecimalPlaces(2);
    const costPerLiter = new Decimal(input.costPerLiter).toDecimalPlaces(2);
    if (liters.lessThanOrEqualTo(0)) throw new ValidationFailedError("liters must be greater than zero");
    if (costPerLiter.lessThanOrEqualTo(0)) throw new ValidationFailedError("costPerLiter must be greater than zero");
    const totalCost = liters.times(costPerLiter).toDecimalPlaces(2);

    return tx.fuelRecord.create({
      data: {
        companyId,
        vehicleId: vehicle.id,
        driverId,
        tripId: input.tripId,
        filledAt: new Date(input.filledAt),
        liters,
        costPerLiter,
        totalCost,
        odometerKm: input.odometerKm,
      },
    });
  });
}

export async function listFuelRecords(companyId: string, vehicleId?: string) {
  return prisma.fuelRecord.findMany({
    where: { companyId, ...(vehicleId ? { vehicleId } : {}) },
    orderBy: { filledAt: "desc" },
  });
}

export async function getTotalFuelCost(companyId: string, vehicleId: string): Promise<Decimal> {
  const records = await prisma.fuelRecord.findMany({ where: { companyId, vehicleId } });
  return records.reduce((sum, r) => sum.plus(r.totalCost), new Decimal(0));
}
