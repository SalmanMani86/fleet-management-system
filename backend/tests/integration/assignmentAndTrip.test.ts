import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { createTestCompany, cleanupTestCompany } from "./testFixtures";
import {
  assignDriverToVehicle,
  getCurrentAssignment,
  getAssignmentHistory,
} from "../../src/modules/vehicleAssignment/vehicleAssignment.service";
import { createTrip, transitionTripStatus, setTripAmount, getTrip } from "../../src/modules/trip/trip.service";
import { setVehicleStatus } from "../../src/modules/vehicle/vehicle.service";
import { InvalidStateError } from "../../src/lib/errors";

describe("integration: assessment brief scenario — vehicle assigned to Driver A, trip created, then transferred to Driver B", () => {
  let companyId: string;
  let vehicleId: string;
  let driverAId: string;
  let driverBId: string;
  let customerId: string;

  beforeAll(async () => {
    const fixture = await createTestCompany("Fleet Integration Test Co.");
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

  it("assigns the vehicle to Driver A", async () => {
    const assignment = await assignDriverToVehicle(companyId, { vehicleId, driverId: driverAId });
    expect(assignment.driverId).toBe(driverAId);
    expect(assignment.effectiveTo).toBeNull();

    const current = await getCurrentAssignment(companyId, vehicleId);
    expect(current?.driverId).toBe(driverAId);
  });

  let tripId: string;

  it("creates a trip that snapshots Driver A as the resolved driver", async () => {
    const trip = await createTrip(companyId, {
      vehicleId,
      customerId,
      loadingPoint: "Riyadh",
      deliveryPoint: "Jeddah",
      amount: 500,
    });
    tripId = trip.id;
    expect(trip.driverId).toBe(driverAId);
    expect(trip.status).toBe("PLANNED");
  });

  it("transfers the vehicle to Driver B, closing out Driver A's assignment", async () => {
    const reassignment = await assignDriverToVehicle(companyId, { vehicleId, driverId: driverBId });
    expect(reassignment.driverId).toBe(driverBId);

    const current = await getCurrentAssignment(companyId, vehicleId);
    expect(current?.driverId).toBe(driverBId);

    const history = await getAssignmentHistory(companyId, vehicleId);
    expect(history).toHaveLength(2);
    const driverARecord = history.find((h) => h.driverId === driverAId);
    expect(driverARecord?.effectiveTo).not.toBeNull();
  });

  it("the earlier trip still shows Driver A, unaffected by the reassignment", async () => {
    const trip = await getTrip(companyId, tripId);
    expect(trip?.driverId).toBe(driverAId);
  });

  it("completing the trip retains the original driverId even though the vehicle is now with Driver B", async () => {
    await transitionTripStatus(companyId, tripId, "IN_PROGRESS");
    const completed = await transitionTripStatus(companyId, tripId, "COMPLETED");
    expect(completed.status).toBe("COMPLETED");
    expect(completed.driverId).toBe(driverAId);

    const current = await getCurrentAssignment(companyId, vehicleId);
    expect(current?.driverId).toBe(driverBId);
  });

  it("rejects creating a trip amount of zero or negative before completion", async () => {
    const trip = await createTrip(companyId, {
      vehicleId,
      customerId,
      loadingPoint: "Riyadh",
      deliveryPoint: "Jeddah",
    });
    await expect(setTripAmount(companyId, trip.id, 0)).rejects.toThrow(/greater than zero/);
  });

  it("rejects completing a trip that has no positive amount set", async () => {
    const trip = await createTrip(companyId, {
      vehicleId,
      customerId,
      loadingPoint: "Riyadh",
      deliveryPoint: "Jeddah",
    });
    await transitionTripStatus(companyId, trip.id, "IN_PROGRESS");
    await expect(transitionTripStatus(companyId, trip.id, "COMPLETED")).rejects.toThrow(/positive amount/);
  });

  it("rejects trip creation for an INACTIVE vehicle", async () => {
    await setVehicleStatus(companyId, vehicleId, "INACTIVE");
    await expect(
      createTrip(companyId, { vehicleId, customerId, loadingPoint: "Riyadh", deliveryPoint: "Jeddah", amount: 100 })
    ).rejects.toThrow(InvalidStateError);
    await setVehicleStatus(companyId, vehicleId, "ACTIVE");
  });
});
