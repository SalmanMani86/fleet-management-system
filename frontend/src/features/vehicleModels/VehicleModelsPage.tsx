import { useState } from "react";
import { useCompany } from "../../context/useCompany";
import { useApi } from "../../lib/useApi";
import { vehicleModelsApi } from "../../api/vehicleModels";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Table, THead, TH, TBody, TR, TD } from "../../components/Table";
import { FullPageSpinner, ErrorBanner, EmptyState } from "../../components/Feedback";
import { Modal } from "../../components/Modal";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await vehicleModelsApi.create(companyId, {
        make,
        modelName,
        manufactureYear,
        capacityKg: capacityKg || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vehicle model");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="New vehicle model" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
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
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create model
          </Button>
        </div>
      </form>
    </Modal>
  );
}
