import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { createTestCompany, cleanupTestCompany } from "./testFixtures";
import { assignDriverToVehicle } from "../../src/modules/vehicleAssignment/vehicleAssignment.service";
import { createTrip } from "../../src/modules/trip/trip.service";

describe("integration: trip idempotency prevents duplicate processing", () => {
  let companyId: string;
  let vehicleId: string;
  let customerId: string;

  beforeAll(async () => {
    const fixture = await createTestCompany("Idempotency Test Co.");
    companyId = fixture.company.id;
    vehicleId = fixture.vehicle.id;
    customerId = fixture.customer.id;
    await assignDriverToVehicle(companyId, { vehicleId, driverId: fixture.driverA.id });
  });

  afterAll(async () => {
    await cleanupTestCompany(companyId);
    await prisma.$disconnect();
  });

  it("rejects a second trip creation with the same idempotency key", async () => {
    const key = `idem-trip-${Date.now()}`;

    const first = await createTrip(companyId, { vehicleId, customerId, amount: 300, idempotencyKey: key });
    expect(first.idempotencyKey).toBe(key);

    await expect(
      createTrip(companyId, { vehicleId, customerId, amount: 999, idempotencyKey: key })
    ).rejects.toThrow(/already been processed/);

    const trips = await prisma.trip.findMany({ where: { companyId, idempotencyKey: key } });
    expect(trips).toHaveLength(1);
  });
});
