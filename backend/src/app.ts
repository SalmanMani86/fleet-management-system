import express from "express";
import cors from "cors";
import { companyRouter } from "./modules/company/company.routes";
import { vehicleModelRouter } from "./modules/vehicleModel/vehicleModel.routes";
import { vehicleRouter } from "./modules/vehicle/vehicle.routes";
import { driverRouter } from "./modules/driver/driver.routes";
import { trailerRouter } from "./modules/trailer/trailer.routes";
import { customerRouter } from "./modules/customer/customer.routes";
import { vehicleAssignmentRouter } from "./modules/vehicleAssignment/vehicleAssignment.routes";
import { trailerAssignmentRouter } from "./modules/trailerAssignment/trailerAssignment.routes";
import { vehicleDocumentRouter } from "./modules/vehicleDocument/vehicleDocument.routes";
import { maintenanceRouter } from "./modules/maintenance/maintenance.routes";
import { fuelRouter } from "./modules/fuel/fuel.routes";
import { tripRouter } from "./modules/trip/trip.routes";
import { vehicleProfileRouter } from "./modules/vehicleProfile/vehicleProfile.routes";
import { auditLogRouter } from "./modules/auditLog/auditLog.routes";
import { companyContext } from "./middleware/companyContext";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Top-level company creation/listing is not itself company-scoped.
  app.use("/api/companies", companyRouter);

  // Every other resource is nested under a resolved, validated :companyId,
  // enforced by companyContext BEFORE any of these routers run. This is the
  // server-side, query-level isolation boundary: req.companyId is threaded
  // into every downstream Prisma call from here on.
  const companyScoped = express.Router({ mergeParams: true });
  companyScoped.use("/vehicle-models", vehicleModelRouter);
  companyScoped.use("/vehicles", vehicleRouter);
  companyScoped.use("/drivers", driverRouter);
  companyScoped.use("/trailers", trailerRouter);
  companyScoped.use("/customers", customerRouter);
  companyScoped.use("/vehicle-assignments", vehicleAssignmentRouter);
  companyScoped.use("/trailer-assignments", trailerAssignmentRouter);
  companyScoped.use("/vehicle-documents", vehicleDocumentRouter);
  companyScoped.use("/maintenance-records", maintenanceRouter);
  companyScoped.use("/fuel-records", fuelRouter);
  companyScoped.use("/trips", tripRouter);
  companyScoped.use("/vehicle-profile", vehicleProfileRouter);
  companyScoped.use("/audit-logs", auditLogRouter);

  app.use("/api/companies/:companyId", companyContext, companyScoped);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
