export type VehicleStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";
export type DriverStatus = "ACTIVE" | "INACTIVE";
export type TrailerStatus = "ACTIVE" | "INACTIVE";
export type TripStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type DocumentType = "REGISTRATION" | "INSURANCE" | "INSPECTION" | "PERMIT" | "OTHER";

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface VehicleModel {
  id: string;
  companyId: string;
  make: string;
  modelName: string;
  manufactureYear: number;
  capacityKg: string | null;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  companyId: string;
  vehicleModelId: string;
  vin: string;
  plateNumber: string;
  manufactureYear: number;
  status: VehicleStatus;
  createdAt: string;
  vehicleModel?: VehicleModel;
}

export interface Driver {
  id: string;
  companyId: string;
  fullName: string;
  licenseNumber: string;
  licenseExpiry: string | null;
  phone: string | null;
  status: DriverStatus;
  createdAt: string;
}

export interface Trailer {
  id: string;
  companyId: string;
  plateNumber: string;
  trailerType: string | null;
  capacityKg: string | null;
  status: TrailerStatus;
  createdAt: string;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  contactInfo: string | null;
  createdAt: string;
}

export interface VehicleAssignment {
  id: string;
  companyId: string;
  vehicleId: string;
  driverId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  driver?: Driver;
}

export interface TrailerAssignment {
  id: string;
  companyId: string;
  vehicleId: string;
  trailerId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  trailer?: Trailer;
}

export interface VehicleDocument {
  id: string;
  companyId: string;
  vehicleId: string;
  documentType: DocumentType;
  documentNumber: string | null;
  issuedDate: string | null;
  expiryDate: string;
  fileUrl: string | null;
  createdAt: string;
  vehicle?: Vehicle;
}

export interface MaintenanceRecord {
  id: string;
  companyId: string;
  vehicleId: string;
  description: string;
  scheduledDate: string | null;
  completedDate: string | null;
  odometerKm: number | null;
  cost: string | null;
  status: MaintenanceStatus;
  createdAt: string;
}

export interface MaintenanceStatusLog {
  id: string;
  companyId: string;
  maintenanceRecordId: string;
  fromStatus: MaintenanceStatus | null;
  toStatus: MaintenanceStatus;
  note: string | null;
  createdAt: string;
}

export interface FuelRecord {
  id: string;
  companyId: string;
  vehicleId: string;
  driverId: string;
  tripId: string | null;
  filledAt: string;
  liters: string;
  costPerLiter: string;
  totalCost: string;
  odometerKm: number | null;
  createdAt: string;
}

export interface Trip {
  id: string;
  companyId: string;
  vehicleId: string;
  driverId: string;
  trailerId: string | null;
  customerId: string;
  loadingPoint: string | null;
  deliveryPoint: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  amount: string | null;
  status: TripStatus;
  idempotencyKey: string | null;
  createdAt: string;
  driver?: Driver;
  trailer?: Trailer | null;
  customer?: Customer;
  vehicle?: Vehicle;
}

export interface VehicleProfile {
  vehicle: Vehicle;
  vehicleModel: VehicleModel | null;
  currentDriver: Driver | null;
  currentTrailer: Trailer | null;
  documents: VehicleDocument[];
  expiringDocuments: VehicleDocument[];
  maintenanceRecords: MaintenanceRecord[];
  fuelRecords: FuelRecord[];
  trips: Trip[];
  costs: {
    maintenanceCost: string;
    fuelCost: string;
    totalCost: string;
  };
}

export interface AuditLogEntry {
  id: string;
  companyId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: unknown;
  afterState: unknown;
  createdAt: string;
}
