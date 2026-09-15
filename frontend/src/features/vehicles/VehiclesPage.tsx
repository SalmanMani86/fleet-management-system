import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../context/useCompany";
import { useApi } from "../../lib/useApi";
import { vehiclesApi } from "../../api/vehicles";
import { vehicleModelsApi } from "../../api/vehicleModels";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Table, THead, TH, TBody, TR, TD } from "../../components/Table";
import { FullPageSpinner, ErrorBanner, EmptyState } from "../../components/Feedback";
import { StatusBadge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import { Field, Input, Select } from "../../components/Field";

export function VehiclesPage() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany!.id;
  const navigate = useNavigate();
  const { data: vehicles, isLoading, error, reload } = useApi(() => vehiclesApi.list(companyId), [companyId]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Click a vehicle to open its full profile: current driver, trailer, documents, maintenance, fuel, trips, and costs."
        actions={<Button onClick={() => setIsCreateOpen(true)}>New vehicle</Button>}
      />

      {isLoading ? (
        <FullPageSpinner />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !vehicles || vehicles.length === 0 ? (
        <EmptyState title="No vehicles yet" description="Register a vehicle model first, then add a vehicle." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Plate #</TH>
              <TH>VIN</TH>
              <TH>Model</TH>
              <TH align="right">Year</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {vehicles.map((v) => (
              <TR key={v.id} onClick={() => navigate(`/vehicles/${v.id}`)}>
                <TD className="font-medium text-slate-900">{v.plateNumber}</TD>
                <TD className="text-slate-500">{v.vin}</TD>
                <TD>{v.vehicleModel ? `${v.vehicleModel.make} ${v.vehicleModel.modelName}` : "—"}</TD>
                <TD align="right">{v.manufactureYear}</TD>
                <TD>
                  <StatusBadge status={v.status} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {isCreateOpen && (
        <CreateVehicleModal
          companyId={companyId}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function CreateVehicleModal({
  companyId,
  onClose,
  onCreated,
}: {
  companyId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { data: models } = useApi(() => vehicleModelsApi.list(companyId), [companyId]);
  const [vehicleModelId, setVehicleModelId] = useState("");
  const [vin, setVin] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [manufactureYear, setManufactureYear] = useState(new Date().getFullYear());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await vehiclesApi.create(companyId, { vehicleModelId, vin, plateNumber, manufactureYear });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vehicle");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="New vehicle" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Field label="Vehicle model" hint={!models?.length ? "Create a vehicle model first." : undefined}>
          <Select required value={vehicleModelId} onChange={(e) => setVehicleModelId(e.target.value)}>
            <option value="">Select a model…</option>
            {models?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.make} {m.modelName} ({m.manufactureYear})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="VIN">
          <Input required value={vin} onChange={(e) => setVin(e.target.value)} />
        </Field>
        <Field label="Plate number">
          <Input required value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
        </Field>
        <Field label="Manufacture year">
          <Input
            type="number"
            required
            min={1950}
            max={2100}
            value={manufactureYear}
            onChange={(e) => setManufactureYear(Number(e.target.value))}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!models?.length}>
            Create vehicle
          </Button>
        </div>
      </form>
    </Modal>
  );
}
