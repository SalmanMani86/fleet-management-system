import { prisma } from "../../lib/prisma";

export async function createCompany(name: string) {
  return prisma.company.create({ data: { name } });
}

export async function listCompanies() {
  return prisma.company.findMany({ orderBy: { createdAt: "desc" } });
}
