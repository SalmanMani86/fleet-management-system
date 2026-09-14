import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { createTestCompany, cleanupTestCompany } from "./testFixtures";
import {
  createMaintenanceRecord,
  transitionMaintenanceStatus,
  getMaintenanceStatusHistory,
} from "../../src/modules/maintenance/maintenance.service";
import { createFuelRecord } from "../../src/modules/fuel/fuel.service";
import { createTrip } from "../../src/modules/trip/trip.service";
import { assignDriverToVehicle } from "../../src/modules/vehicleAssignment/vehicleAssignment.service";
import { InvalidStateError, ValidationFailedError } from "../../src/lib/errors";

describe("integration: maintenance status audit trail and fuel/trip driver consistency", () => {
  let companyId: string;
  let vehicleId: string;
  let driverAId: string;
  let driverBId: string;
  let customerId: string;

  beforeAll(async () => {
    const fixture = await createTestCompany("Maintenance Fuel Test Co.");
    companyId = fixture.company.id;
    vehicleId = fixture.vehicle.id;
    driverAId = fixture.driverA.id;
    driverBId = fixture.driverB.id;
    customerId = fixture.customer.id;
  });

  afterAll(async () => {
    await cleanupTestCompany(companyId);
    await prisma.$disconnect();
  });

  it("records every maintenance status transition in the append-only log", async () => {
    const record = await createMaintenanceRecord(companyId, {
      vehicleId,
      description: "Oil change",
    });

    await transitionMaintenanceStatus(companyId, record.id, "IN_PROGRESS");
    await transitionMaintenanceStatus(companyId, record.id, "COMPLETED");

    const history = await getMaintenanceStatusHistory(companyId, record.id);
    expect(history.map((h) => h.toStatus)).toEqual(["SCHEDULED", "IN_PROGRESS", "COMPLETED"]);

    const vehicle = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
    expect(vehicle.status).toBe("ACTIVE");
  });

  it("puts the vehicle into MAINTENANCE status while work is in progress", async () => {
    const record = await createMaintenanceRecord(companyId, { vehicleId, description: "Brake service" });
    await transitionMaintenanceStatus(companyId, record.id, "IN_PROGRESS");

    const vehicle = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
    expect(vehicle.status).toBe("MAINTENANCE");

    await transitionMaintenanceStatus(companyId, record.id, "COMPLETED");
    const restored = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
    expect(restored.status).toBe("ACTIVE");
  });

  it("rejects an invalid maintenance status transition (COMPLETED -> IN_PROGRESS)", async () => {
    const record = await createMaintenanceRecord(companyId, { vehicleId, description: "Tire rotation" });
    await transitionMaintenanceStatus(companyId, record.id, "IN_PROGRESS");
    await transitionMaintenanceStatus(companyId, record.id, "COMPLETED");

    await expect(transitionMaintenanceStatus(companyId, record.id, "IN_PROGRESS")).rejects.toThrow(InvalidStateError);
  });

  it("derives and locks a fuel record's driverId from its linked trip, ignoring a contradicting client value", async () => {
    await assignDriverToVehicle(companyId, { vehicleId, driverId: driverAId });
    const trip = await createTrip(companyId, { vehicleId, customerId, amount: 200 });
    expect(trip.driverId).toBe(driverAId);

    // Client attempts to claim Driver B fueled the vehicle for this trip —
    // the service must ignore that and use the trip's actual driver (A).
    const fuelRecord = await createFuelRecord(companyId, {
      vehicleId,
      driverId: driverBId,
      tripId: trip.id,
      filledAt: new Date().toISOString(),
      liters: 50,
      costPerLiter: 3.5,
    });

    expect(fuelRecord.driverId).toBe(driverAId);
    expect(fuelRecord.totalCost.toFixed(2)).toBe("175.00");
  });

  it("rejects a fuel record with no driverId and no linked trip", async () => {
    await expect(
      createFuelRecord(companyId, {
        vehicleId,
        filledAt: new Date().toISOString(),
        liters: 10,
        costPerLiter: 3,
      })
    ).rejects.toThrow(ValidationFailedError);
  });
});
