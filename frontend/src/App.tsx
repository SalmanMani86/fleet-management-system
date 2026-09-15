import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CompanyProvider } from "./context/CompanyContext";
import { Layout } from "./components/Layout";
import { VehiclesPage } from "./features/vehicles/VehiclesPage";
import { VehicleProfilePage } from "./features/vehicles/VehicleProfilePage";
import { VehicleModelsPage } from "./features/vehicleModels/VehicleModelsPage";
import { DriversPage } from "./features/drivers/DriversPage";
import { TrailersPage } from "./features/trailers/TrailersPage";
import { CustomersPage } from "./features/customers/CustomersPage";
import { TripsPage } from "./features/trips/TripsPage";
import { MaintenancePage } from "./features/maintenance/MaintenancePage";
import { FuelPage } from "./features/fuel/FuelPage";
import { DocumentsPage } from "./features/documents/DocumentsPage";
import { AuditLogPage } from "./features/auditLog/AuditLogPage";

export default function App() {
  return (
    <BrowserRouter>
      <CompanyProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<VehiclesPage />} />
            <Route path="/vehicles/:vehicleId" element={<VehicleProfilePage />} />
            <Route path="/vehicle-models" element={<VehicleModelsPage />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/trailers" element={<TrailersPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/fuel" element={<FuelPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
          </Route>
        </Routes>
      </CompanyProvider>
    </BrowserRouter>
  );
}
