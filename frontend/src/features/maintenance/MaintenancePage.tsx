import { useState } from "react";
import { useCompany } from "../../context/useCompany";
import { useApi } from "../../lib/useApi";
import { maintenanceApi } from "../../api/maintenance";
import { vehiclesApi } from "../../api/vehicles";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Table, THead, TH, TBody, TR, TD } from "../../components/Table";
import { FullPageSpinner, ErrorBanner, EmptyState } from "../../components/Feedback";
import { StatusBadge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import { Field, Input, Select } from "../../components/Field";
import { formatDate, formatMoney } from "../../lib/format";
import type { MaintenanceRecord, MaintenanceStatus, Vehicle } from "../../types";

const NEXT_STATUS: Partial<Record<MaintenanceStatus, MaintenanceStatus[]>> = {
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
};

export function MaintenancePage() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany!.id;
  const { data: records, isLoading, error, reload } = useApi(() => maintenanceApi.list(companyId), [companyId]);
  const { data: vehicles } = useApi(() => vehiclesApi.list(companyId), [companyId]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  function plateFor(vehicleId: string) {
    return vehicles?.find((v) => v.id === vehicleId)?.plateNumber ?? vehicleId;
  }

  async function transition(record: MaintenanceRecord, status: MaintenanceStatus) {
    try {
      await maintenanceApi.transitionStatus(companyId, record.id, status);
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update maintenance status");
    }
  }

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Every status change is written to an append-only audit log. Moving to IN_PROGRESS puts the vehicle into MAINTENANCE status automatically."
        actions={<Button onClick={() => setIsCreateOpen(true)}>New record</Button>}
      />

      {isLoading ? (
        <FullPageSpinner />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !records || records.length === 0 ? (
        <EmptyState title="No maintenance records yet" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Vehicle</TH>
              <TH>Description</TH>
              <TH>Scheduled</TH>
              <TH align="right">Cost</TH>
              <TH>Status</TH>
              <TH align="right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {records.map((r) => (
              <TR key={r.id}>
                <TD className="font-medium text-slate-900">{plateFor(r.vehicleId)}</TD>
                <TD>{r.description}</TD>
                <TD>{formatDate(r.scheduledDate)}</TD>
                <TD align="right">{r.cost ? formatMoney(r.cost) : "—"}</TD>
                <TD>
                  <StatusBadge status={r.status} />
                </TD>
                <TD align="right">
                  <div className="flex justify-end gap-1.5">
                    {(NEXT_STATUS[r.status] ?? []).map((next) => (
                      <Button key={next} size="sm" variant={next === "CANCELLED" ? "danger" : "secondary"} onClick={() => transition(r, next)}>
                        {next.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {isCreateOpen && (
        <CreateMaintenanceModal
          companyId={companyId}
          vehicles={vehicles ?? []}
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

function CreateMaintenanceModal({
  companyId,
  vehicles,
  onClose,
  onCreated,
}: {
  companyId: string;
  vehicles: Vehicle[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [vehicleId, setVehicleId] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [cost, setCost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await maintenanceApi.create(companyId, {
        vehicleId,
        description,
        scheduledDate: scheduledDate || undefined,
        cost: cost || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create maintenance record");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="New maintenance record" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Field label="Vehicle">
          <Select required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Select a vehicle…</option>
            {vehicles?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plateNumber}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description">
          <Input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Oil change" />
        </Field>
        <Field label="Scheduled date (optional)">
          <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
        </Field>
        <Field label="Estimated cost (optional)">
          <Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create record
          </Button>
        </div>
      </form>
    </Modal>
  );
}
