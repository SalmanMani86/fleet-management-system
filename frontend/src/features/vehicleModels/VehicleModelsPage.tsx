import { useState } from "react";
import { useCompany } from "../../context/useCompany";
import { useApi } from "../../lib/useApi";
import { useSubmit } from "../../lib/useSubmit";
import { vehicleModelsApi, type CreateVehicleModelInput } from "../../api/vehicleModels";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Table, THead, TH, TBody, TR, TD } from "../../components/Table";
import { FullPageSpinner, ErrorBanner, EmptyState } from "../../components/Feedback";
import { FormModal } from "../../components/FormModal";
import { Field, Input } from "../../components/Field";

export function VehicleModelsPage() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany!.id;
  const { data: models, isLoading, error, reload } = useApi(() => vehicleModelsApi.list(companyId), [companyId]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Vehicle Models"
        description="Reference data for make, model, and manufacturing year used when registering vehicles."
        actions={<Button onClick={() => setIsCreateOpen(true)}>New model</Button>}
      />

      {isLoading ? (
        <FullPageSpinner />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !models || models.length === 0 ? (
        <EmptyState title="No vehicle models yet" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Make</TH>
              <TH>Model</TH>
              <TH align="right">Year</TH>
              <TH align="right">Capacity (kg)</TH>
            </tr>
          </THead>
          <TBody>
            {models.map((m) => (
              <TR key={m.id}>
                <TD className="font-medium text-slate-900">{m.make}</TD>
                <TD>{m.modelName}</TD>
                <TD align="right">{m.manufactureYear}</TD>
                <TD align="right">{m.capacityKg ?? "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {isCreateOpen && (
        <CreateVehicleModelModal
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

function CreateVehicleModelModal({
  companyId,
  onClose,
  onCreated,
}: {
  companyId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [make, setMake] = useState("");
  const [modelName, setModelName] = useState("");
  const [manufactureYear, setManufactureYear] = useState(new Date().getFullYear());
  const [capacityKg, setCapacityKg] = useState("");

  const { submit, isSubmitting, error } = useSubmit(
    (input: CreateVehicleModelInput) => vehicleModelsApi.create(companyId, input),
    onCreated
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit({ make, modelName, manufactureYear, capacityKg: capacityKg || undefined }, "Failed to create vehicle model");
  }

  return (
    <FormModal
      title="New vehicle model"
      onClose={onClose}
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Create model"
    >
      <Field label="Make">
        <Input required value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Volvo" />
      </Field>
      <Field label="Model">
        <Input required value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="e.g. FH16" />
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
      <Field label="Capacity (kg, optional)">
        <Input type="number" value={capacityKg} onChange={(e) => setCapacityKg(e.target.value)} />
      </Field>
    </FormModal>
  );
}
