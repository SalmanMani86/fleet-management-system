import { prisma } from "../../src/lib/prisma";

export async function createTestCompany(name: string) {
  const company = await prisma.company.create({ data: { name } });

  const vehicleModel = await prisma.vehicleModel.create({
    data: { companyId: company.id, make: "Volvo", modelName: "FH16", manufactureYear: 2022 },
  });

  const vehicle = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      vehicleModelId: vehicleModel.id,
      vin: `VIN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      plateNumber: `PLT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      manufactureYear: 2022,
    },
  });

  const driverA = await prisma.driver.create({
    data: { companyId: company.id, fullName: "Driver A", licenseNumber: `LIC-A-${Date.now()}` },
  });

  const driverB = await prisma.driver.create({
    data: { companyId: company.id, fullName: "Driver B", licenseNumber: `LIC-B-${Date.now()}` },
  });

  const trailer = await prisma.trailer.create({
    data: { companyId: company.id, plateNumber: `TRL-${Date.now()}` },
  });

  const customer = await prisma.customer.create({
    data: { companyId: company.id, name: "Test Customer" },
  });

  return { company, vehicleModel, vehicle, driverA, driverB, trailer, customer };
}

export async function cleanupTestCompany(companyId: string) {
  await prisma.fuelRecord.deleteMany({ where: { companyId } });
  await prisma.trip.deleteMany({ where: { companyId } });
  await prisma.maintenanceStatusLog.deleteMany({ where: { companyId } });
  await prisma.maintenanceRecord.deleteMany({ where: { companyId } });
  await prisma.vehicleDocument.deleteMany({ where: { companyId } });
  await prisma.trailerAssignment.deleteMany({ where: { companyId } });
  await prisma.vehicleAssignment.deleteMany({ where: { companyId } });
  await prisma.trip.deleteMany({ where: { companyId } });
  await prisma.customer.deleteMany({ where: { companyId } });
  await prisma.trailer.deleteMany({ where: { companyId } });
  await prisma.driver.deleteMany({ where: { companyId } });
  await prisma.vehicle.deleteMany({ where: { companyId } });
  await prisma.vehicleModel.deleteMany({ where: { companyId } });
  await prisma.auditLog.deleteMany({ where: { companyId } });
  await prisma.company.delete({ where: { id: companyId } });
}
