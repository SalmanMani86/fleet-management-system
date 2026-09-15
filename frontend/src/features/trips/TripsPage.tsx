import { useState } from "react";
import { Link } from "react-router-dom";
import { useCompany } from "../../context/useCompany";
import { useApi } from "../../lib/useApi";
import { tripsApi } from "../../api/trips";
import { vehiclesApi } from "../../api/vehicles";
import { customersApi } from "../../api/customers";
import { vehicleAssignmentsApi } from "../../api/vehicleAssignments";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Table, THead, TH, TBody, TR, TD } from "../../components/Table";
import { FullPageSpinner, ErrorBanner, EmptyState } from "../../components/Feedback";
import { StatusBadge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import { Field, Input, Select } from "../../components/Field";
import { formatDateTime, formatMoney } from "../../lib/format";
import type { Trip, TripStatus } from "../../types";

const NEXT_STATUS: Partial<Record<TripStatus, TripStatus[]>> = {
  PLANNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
};

export function TripsPage() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany!.id;
  const { data: trips, isLoading, error, reload } = useApi(() => tripsApi.list(companyId), [companyId]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function transition(trip: Trip, status: TripStatus) {
    try {
      await tripsApi.transitionStatus(companyId, trip.id, status);
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update trip status");
    }
  }

  return (
    <div>
      <PageHeader
        title="Trips"
        description="Driver and trailer are resolved automatically from the vehicle's current assignment at creation time, and stay fixed even if the vehicle is later reassigned."
        actions={<Button onClick={() => setIsCreateOpen(true)}>New trip</Button>}
      />

      {isLoading ? (
        <FullPageSpinner />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !trips || trips.length === 0 ? (
        <EmptyState title="No trips yet" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Customer</TH>
              <TH>Driver</TH>
              <TH>Trailer</TH>
              <TH align="right">Amount</TH>
              <TH>Status</TH>
              <TH>Created</TH>
              <TH align="right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {trips.map((t) => (
              <TR key={t.id}>
                <TD>{t.customer?.name ?? "—"}</TD>
                <TD className="font-medium text-slate-900">{t.driver?.fullName ?? "—"}</TD>
                <TD>{t.trailer?.plateNumber ?? "—"}</TD>
                <TD align="right">{t.amount ? formatMoney(t.amount) : "—"}</TD>
                <TD>
                  <StatusBadge status={t.status} />
                </TD>
                <TD>{formatDateTime(t.createdAt)}</TD>
                <TD align="right">
                  <div className="flex justify-end gap-1.5">
                    {(NEXT_STATUS[t.status] ?? []).map((next) => (
                      <Button key={next} size="sm" variant={next === "CANCELLED" ? "danger" : "secondary"} onClick={() => transition(t, next)}>
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
        <CreateTripModal
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

function CreateTripModal({
  companyId,
  onClose,
  onCreated,
}: {
  companyId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { data: vehicles } = useApi(() => vehiclesApi.list(companyId, "ACTIVE"), [companyId]);
  const { data: customers } = useApi(() => customersApi.list(companyId), [companyId]);
  const [vehicleId, setVehicleId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [loadingPoint, setLoadingPoint] = useState("");
  const [deliveryPoint, setDeliveryPoint] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: currentAssignment } = useApi(
    () => (vehicleId ? vehicleAssignmentsApi.getCurrent(companyId, vehicleId) : Promise.resolve(null)),
    [companyId, vehicleId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await tripsApi.create(companyId, {
        vehicleId,
        customerId,
        loadingPoint,
        deliveryPoint,
        amount: amount || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trip");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="New trip" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Field label="Vehicle" hint="Only ACTIVE vehicles are selectable for trips.">
          <Select required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Select a vehicle…</option>
            {vehicles?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plateNumber}
              </option>
            ))}
          </Select>
        </Field>

        {vehicleId && (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            {currentAssignment ? (
              <span className="text-slate-600">
                Driver will be resolved automatically: <span className="font-medium text-slate-900">{currentAssignment.driver?.fullName}</span>
              </span>
            ) : (
              <span className="text-rose-600">
                This vehicle has no current driver assignment.{" "}
                <Link to={`/vehicles/${vehicleId}`} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                  Open its profile to assign a driver
                </Link>
                , then come back and select it again.
              </span>
            )}
          </div>
        )}

        <Field label="Customer">
          <Select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select a customer…</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Loading point">
            <Input required value={loadingPoint} onChange={(e) => setLoadingPoint(e.target.value)} />
          </Field>
          <Field label="Delivery point">
            <Input required value={deliveryPoint} onChange={(e) => setDeliveryPoint(e.target.value)} />
          </Field>
        </div>
        <Field label="Amount (optional, required before completion)">
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!!vehicleId && !currentAssignment}>
            Create trip
          </Button>
        </div>
      </form>
    </Modal>
  );
}
