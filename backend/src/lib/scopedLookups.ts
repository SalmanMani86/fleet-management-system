import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { NotFoundError, InvalidStateError } from "./errors";

type TxClient = Prisma.TransactionClient;

/**
 * Every one of these helpers takes companyId as a required argument and
 * bakes it into the WHERE clause. Services must never call
 * `prisma.<model>.findUnique({ where: { id } })` directly on a tenant-owned
 * table — going through these instead makes it structurally impossible for
 * a request scoped to Company A to read a row belonging to Company B: a
 * mismatched id/companyId pair simply looks like "not found".
 */

export async function findVehicleOrThrow(client: TxClient | typeof prisma, companyId: string, vehicleId: string) {
  const vehicle = await client.vehicle.findFirst({ where: { id: vehicleId, companyId } });
  if (!vehicle) throw new NotFoundError("Vehicle");
  return vehicle;
}

export async function findActiveVehicleOrThrow(
  client: TxClient | typeof prisma,
  companyId: string,
  vehicleId: string
) {
  const vehicle = await findVehicleOrThrow(client, companyId, vehicleId);
  if (vehicle.status !== "ACTIVE") {
    throw new InvalidStateError(`Vehicle is ${vehicle.status.toLowerCase()} and not available for operational use`);
  }
  return vehicle;
}

export async function findDriverOrThrow(client: TxClient | typeof prisma, companyId: string, driverId: string) {
  const driver = await client.driver.findFirst({ where: { id: driverId, companyId } });
  if (!driver) throw new NotFoundError("Driver");
  return driver;
}

export async function findActiveDriverOrThrow(client: TxClient | typeof prisma, companyId: string, driverId: string) {
  const driver = await findDriverOrThrow(client, companyId, driverId);
  if (driver.status !== "ACTIVE") {
    throw new InvalidStateError("Driver is inactive and cannot be assigned or scheduled");
  }
  return driver;
}

export async function findTrailerOrThrow(client: TxClient | typeof prisma, companyId: string, trailerId: string) {
  const trailer = await client.trailer.findFirst({ where: { id: trailerId, companyId } });
  if (!trailer) throw new NotFoundError("Trailer");
  return trailer;
}

export async function findVehicleModelOrThrow(
  client: TxClient | typeof prisma,
  companyId: string,
  vehicleModelId: string
) {
  const model = await client.vehicleModel.findFirst({ where: { id: vehicleModelId, companyId } });
  if (!model) throw new NotFoundError("Vehicle model");
  return model;
}

export async function findCustomerOrThrow(client: TxClient | typeof prisma, companyId: string, customerId: string) {
  const customer = await client.customer.findFirst({ where: { id: customerId, companyId } });
  if (!customer) throw new NotFoundError("Customer");
  return customer;
}

export async function findTripOrThrow(client: TxClient | typeof prisma, companyId: string, tripId: string) {
  const trip = await client.trip.findFirst({ where: { id: tripId, companyId } });
  if (!trip) throw new NotFoundError("Trip");
  return trip;
}

export async function findCompanyOrThrow(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new NotFoundError("Company");
  return company;
}
