import { prisma } from "../../lib/prisma";
import { findCustomerOrThrow } from "../../lib/scopedLookups";

export interface CreateCustomerInput {
  name: string;
  contactInfo?: string;
}

export async function createCustomer(companyId: string, input: CreateCustomerInput) {
  return prisma.customer.create({
    data: { companyId, name: input.name, contactInfo: input.contactInfo },
  });
}

export async function listCustomers(companyId: string) {
  return prisma.customer.findMany({ where: { companyId }, orderBy: { name: "asc" } });
}

export async function getCustomer(companyId: string, id: string) {
  return findCustomerOrThrow(prisma, companyId, id);
}
