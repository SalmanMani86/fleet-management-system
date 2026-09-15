import { useState } from "react";
import { useCompany } from "../../context/useCompany";
import { useApi } from "../../lib/useApi";
import { fuelApi } from "../../api/fuel";
import { vehiclesApi } from "../../api/vehicles";
import { driversApi } from "../../api/drivers";
import { tripsApi } from "../../api/trips";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Table, THead, TH, TBody, TR, TD } from "../../components/Table";
import { FullPageSpinner, ErrorBanner, EmptyState } from "../../components/Feedback";
import { Modal } from "../../components/Modal";
import { Field, Input, Select } from "../../components/Field";
import { formatDateTime, formatMoney } from "../../lib/format";
import type { Driver, Trip, Vehicle } from "../../types";

export function FuelPage() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany!.id;
  const { data: records, isLoading, error, reload } = useApi(() => fuelApi.list(companyId), [companyId]);
  const { data: vehicles } = useApi(() => vehiclesApi.list(companyId), [companyId]);
  const { data: drivers } = useApi(() => driversApi.list(companyId), [companyId]);
  const { data: trips } = useApi(() => tripsApi.list(companyId), [companyId]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  function plateFor(vehicleId: string) {
    return vehicles?.find((v) => v.id === vehicleId)?.plateNumber ?? vehicleId;
  }
  function driverFor(driverId: string) {
    return drivers?.find((d) => d.id === driverId)?.fullName ?? driverId;
  }

  return (
    <div>
      <PageHeader
        title="Fuel Records"
        description="If a fuel record is linked to a trip, the driver is locked to that trip's driver — a client cannot submit a conflicting driver."
        actions={<Button onClick={() => setIsCreateOpen(true)}>New record</Button>}
      />

      {isLoading ? (
        <FullPageSpinner />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !records || records.length === 0 ? (
        <EmptyState title="No fuel records yet" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Vehicle</TH>
              <TH>Driver</TH>
              <TH>Filled at</TH>
              <TH align="right">Liters</TH>
              <TH align="right">Cost/L</TH>
              <TH align="right">Total</TH>
              <TH>Linked trip</TH>
            </tr>
          </THead>
          <TBody>
            {records.map((f) => (
              <TR key={f.id}>
                <TD className="font-medium text-slate-900">{plateFor(f.vehicleId)}</TD>
                <TD>{driverFor(f.driverId)}</TD>
                <TD>{formatDateTime(f.filledAt)}</TD>
                <TD align="right">{f.liters}</TD>
                <TD align="right">{formatMoney(f.costPerLiter)}</TD>
                <TD align="right" className="font-medium text-slate-900">
                  {formatMoney(f.totalCost)}
                </TD>
                <TD>{f.tripId ? "Yes" : "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {isCreateOpen && (
        <CreateFuelRecordModal
          companyId={companyId}
          vehicles={vehicles ?? []}
          drivers={drivers ?? []}
          trips={trips ?? []}
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

function CreateFuelRecordModal({
  companyId,
  vehicles,
  drivers,
  trips,
  onClose,
  onCreated,
}: {
  companyId: string;
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [tripId, setTripId] = useState("");
  const [filledAt, setFilledAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [liters, setLiters] = useState("");
  const [costPerLiter, setCostPerLiter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only trips still in flight make sense to link a fuel purchase to — a
  // COMPLETED or CANCELLED trip is closed history, not something new fuel
  // usage should attach to.
  const vehicleTrips =
    trips?.filter((t) => t.vehicleId === vehicleId && (t.status === "PLANNED" || t.status === "IN_PROGRESS")) ?? [];

  function tripLabel(t: Trip): string {
    const route = [t.loadingPoint, t.deliveryPoint].filter(Boolean).join(" → ") || "No route set";
    const amount = t.amount ? formatMoney(t.amount) : "no amount";
    return `${route} · ${amount} · ${t.status.replace("_", " ")} · ${formatDateTime(t.createdAt)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await fuelApi.create(companyId, {
        vehicleId,
        driverId: tripId ? undefined : driverId,
        tripId: tripId || undefined,
        filledAt: new Date(filledAt).toISOString(),
        liters,
        costPerLiter,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fuel record");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="New fuel record" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Field label="Vehicle">
          <Select
            required
            value={vehicleId}
            onChange={(e) => {
              setVehicleId(e.target.value);
              setTripId("");
            }}
          >
            <option value="">Select a vehicle…</option>
            {vehicles?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plateNumber}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Linked trip (optional)"
          hint={
            vehicleId && vehicleTrips.length === 0
              ? "No open (planned/in-progress) trips for this vehicle to link to."
              : "If set, the driver is taken from the trip automatically. Only open trips are shown."
          }
        >
          <Select value={tripId} onChange={(e) => setTripId(e.target.value)} disabled={!vehicleId}>
            <option value="">No linked trip</option>
            {vehicleTrips.map((t) => (
              <option key={t.id} value={t.id}>
                {tripLabel(t)}
              </option>
            ))}
          </Select>
        </Field>
        {!tripId && (
          <Field label="Driver">
            <Select required value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">Select a driver…</option>
              {drivers?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Filled at">
          <Input type="datetime-local" required value={filledAt} onChange={(e) => setFilledAt(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Liters">
            <Input type="number" step="0.01" required value={liters} onChange={(e) => setLiters(e.target.value)} />
          </Field>
          <Field label="Cost per liter">
            <Input type="number" step="0.01" required value={costPerLiter} onChange={(e) => setCostPerLiter(e.target.value)} />
          </Field>
        </div>
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
