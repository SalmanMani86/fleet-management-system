import { Request, Response } from "express";
import { z } from "zod";
import {
  createVehicleDocument,
  listVehicleDocuments,
  getVehicleDocument,
  listExpiringDocuments,
} from "./vehicleDocument.service";

const DocumentTypeEnum = z.enum(["REGISTRATION", "INSURANCE", "INSPECTION", "PERMIT", "OTHER"]);

const CreateVehicleDocumentSchema = z.object({
  vehicleId: z.string().uuid(),
  documentType: DocumentTypeEnum,
  documentNumber: z.string().optional(),
  issuedDate: z.string().optional(),
  expiryDate: z.string(),
  fileUrl: z.string().optional(),
});

export async function createVehicleDocumentHandler(req: Request, res: Response): Promise<void> {
  const input = CreateVehicleDocumentSchema.parse(req.body);
  const doc = await createVehicleDocument(req.companyId, input);
  res.status(201).json(doc);
}

export async function listVehicleDocumentsHandler(req: Request, res: Response): Promise<void> {
  res.json(await listVehicleDocuments(req.companyId, req.params.vehicleId));
}

export async function getVehicleDocumentHandler(req: Request, res: Response): Promise<void> {
  res.json(await getVehicleDocument(req.companyId, req.params.id));
}

export async function listExpiringDocumentsHandler(req: Request, res: Response): Promise<void> {
  const withinDays = Number(req.query.withinDays ?? 30);
  res.json(await listExpiringDocuments(req.companyId, Number.isFinite(withinDays) ? withinDays : 30));
}
