import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCompany } from "../../context/useCompany";
import { useApi } from "../../lib/useApi";
import { vehicleProfileApi } from "../../api/vehicleProfile";
import { vehiclesApi } from "../../api/vehicles";
import { driversApi } from "../../api/drivers";
import { trailersApi } from "../../api/trailers";
import { vehicleAssignmentsApi } from "../../api/vehicleAssignments";
import { trailerAssignmentsApi } from "../../api/trailerAssignments";
import { PageHeader } from "../../components/PageHeader";
import { Card, CardHeader, CardBody } from "../../components/Card";
import { Button } from "../../components/Button";
import { Table, THead, TH, TBody, TR, TD } from "../../components/Table";
import { FullPageSpinner, ErrorBanner, EmptyState } from "../../components/Feedback";
import { StatusBadge, Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import { Field, Select } from "../../components/Field";
import { formatDate, formatDateTime, formatMoney, daysUntil } from "../../lib/format";
import type { VehicleStatus } from "../../types";

export function VehicleProfilePage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { currentCompany } = useCompany();
  const companyId = currentCompany!.id;
  const { data: profile, isLoading, error, reload } = useApi(
    () => vehicleProfileApi.get(companyId, vehicleId!),
    [companyId, vehicleId]
  );
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  if (isLoading) return <FullPageSpinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!profile) return <EmptyState title="Vehicle not found" />;

  const { vehicle, vehicleModel, currentDriver, currentTrailer, documents, expiringDocuments, maintenanceRecords, fuelRecords, trips, costs } =
    profile;

  async function setStatus(status: VehicleStatus) {
    await vehiclesApi.setStatus(companyId, vehicle.id, status);
    reload();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={vehicle.plateNumber}
        description={vehicleModel ? `${vehicleModel.make} ${vehicleModel.modelName} · ${vehicle.manufactureYear}` : undefined}
        actions={
          <>
            <StatusBadge status={vehicle.status} />
            <VehicleStatusMenu status={vehicle.status} onChange={setStatus} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Current driver</span>
            <Button size="sm" variant="secondary" onClick={() => setIsReassignOpen(true)}>
              Reassign
            </Button>
          </CardHeader>
          <CardBody>
            {currentDriver ? (
              <div>
                <p className="text-sm font-medium text-slate-900">{currentDriver.fullName}</p>
                <p className="text-xs text-slate-400">License {currentDriver.licenseNumber}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No driver assigned</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Current trailer</span>
            <Button size="sm" variant="secondary" onClick={() => setIsTrailerOpen(true)}>
              Reassign
            </Button>
          </CardHeader>
          <CardBody>
            {currentTrailer ? (
              <div>
                <p className="text-sm font-medium text-slate-900">{currentTrailer.plateNumber}</p>
                <p className="text-xs text-slate-400">{currentTrailer.trailerType ?? "—"}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No trailer attached</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <span className="text-sm font-semibold text-slate-900">Vehicle-related costs</span>
          </CardHeader>
          <CardBody className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Maintenance</span>
              <span className="font-medium text-slate-800">{formatMoney(costs.maintenanceCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Fuel</span>
              <span className="font-medium text-slate-800">{formatMoney(costs.fuelCost)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-slate-100 pt-1 text-sm">
              <span className="font-semibold text-slate-700">Total</span>
              <span className="font-semibold text-slate-900">{formatMoney(costs.totalCost)}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <span className="text-sm font-semibold text-slate-900">Documents</span>
        </CardHeader>
        <CardBody>
          {documents.length === 0 ? (
            <p className="text-sm text-slate-400">No documents on file</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Type</TH>
                  <TH>Document #</TH>
                  <TH>Expiry</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <TBody>
                {documents.map((d) => {
                  const isExpiring = expiringDocuments.some((e) => e.id === d.id);
                  const days = daysUntil(d.expiryDate);
                  return (
                    <TR key={d.id}>
                      <TD>{d.documentType}</TD>
                      <TD>{d.documentNumber ?? "—"}</TD>
                      <TD>{formatDate(d.expiryDate)}</TD>
                      <TD>
                        {days < 0 ? (
                          <Badge tone="rose">Expired</Badge>
                        ) : isExpiring ? (
                          <Badge tone="amber">Expires in {days}d</Badge>
                        ) : (
                          <Badge tone="green">Valid</Badge>
                        )}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <span className="text-sm font-semibold text-slate-900">Maintenance history</span>
        </CardHeader>
        <CardBody>
          {maintenanceRecords.length === 0 ? (
            <p className="text-sm text-slate-400">No maintenance records</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Description</TH>
                  <TH>Scheduled</TH>
                  <TH>Completed</TH>
                  <TH align="right">Cost</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <TBody>
                {maintenanceRecords.map((m) => (
                  <TR key={m.id}>
                    <TD className="font-medium text-slate-900">{m.description}</TD>
                    <TD>{formatDate(m.scheduledDate)}</TD>
                    <TD>{formatDate(m.completedDate)}</TD>
                    <TD align="right">{m.cost ? formatMoney(m.cost) : "—"}</TD>
                    <TD>
                      <StatusBadge status={m.status} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <span className="text-sm font-semibold text-slate-900">Fuel records</span>
        </CardHeader>
        <CardBody>
          {fuelRecords.length === 0 ? (
            <p className="text-sm text-slate-400">No fuel records</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Filled at</TH>
                  <TH align="right">Liters</TH>
                  <TH align="right">Cost/L</TH>
                  <TH align="right">Total</TH>
                  <TH>Linked trip</TH>
                </tr>
              </THead>
              <TBody>
                {fuelRecords.map((f) => (
                  <TR key={f.id}>
                    <TD>{formatDateTime(f.filledAt)}</TD>
                    <TD align="right">{f.liters}</TD>
                    <TD align="right">{formatMoney(f.costPerLiter)}</TD>
                    <TD align="right" className="font-medium text-slate-900">
                      {formatMoney(f.totalCost)}
                    </TD>
                    <TD>{f.tripId ? <Link className="text-brand-600 hover:underline" to="/trips">View</Link> : "—"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <span className="text-sm font-semibold text-slate-900">Trip history</span>
        </CardHeader>
        <CardBody>
          {trips.length === 0 ? (
            <p className="text-sm text-slate-400">No trips yet</p>
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
                </tr>
              </THead>
              <TBody>
                {trips.map((t) => (
                  <TR key={t.id}>
                    <TD>{t.customer?.name ?? "—"}</TD>
                    <TD>{t.driver?.fullName ?? "—"}</TD>
                    <TD>{t.trailer?.plateNumber ?? "—"}</TD>
                    <TD align="right">{t.amount ? formatMoney(t.amount) : "—"}</TD>
                    <TD>
                      <StatusBadge status={t.status} />
                    </TD>
                    <TD>{formatDateTime(t.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {isReassignOpen && (
        <ReassignDriverModal
          companyId={companyId}
          vehicleId={vehicle.id}
          onClose={() => setIsReassignOpen(false)}
          onDone={() => {
            setIsReassignOpen(false);
            reload();
          }}
        />
      )}

      {isTrailerOpen && (
        <ReassignTrailerModal
          companyId={companyId}
          vehicleId={vehicle.id}
          onClose={() => setIsTrailerOpen(false)}
          onDone={() => {
            setIsTrailerOpen(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function VehicleStatusMenu({ status, onChange }: { status: VehicleStatus; onChange: (s: VehicleStatus) => void }) {
  const options: VehicleStatus[] = ["ACTIVE", "INACTIVE", "MAINTENANCE"];
  return (
    <Select
      value={status}
      onChange={(e) => onChange(e.target.value as VehicleStatus)}
      className="w-auto"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </Select>
  );
}

function ReassignDriverModal({
  companyId,
  vehicleId,
  onClose,
  onDone,
}: {
  companyId: string;
  vehicleId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { data: drivers } = useApi(() => driversApi.list(companyId, "ACTIVE"), [companyId]);
  const [driverId, setDriverId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await vehicleAssignmentsApi.assign(companyId, { vehicleId, driverId });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reassign driver");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Reassign driver" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Field label="Driver" hint="The previous assignment (if any) is closed out, not deleted — full history is preserved.">
          <Select required value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">Select a driver…</option>
            {drivers?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Assign
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ReassignTrailerModal({
  companyId,
  vehicleId,
  onClose,
  onDone,
}: {
  companyId: string;
  vehicleId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { data: trailers } = useApi(() => trailersApi.list(companyId, "ACTIVE"), [companyId]);
  const [trailerId, setTrailerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await trailerAssignmentsApi.assign(companyId, { vehicleId, trailerId });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reassign trailer");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Reassign trailer" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Field label="Trailer">
          <Select required value={trailerId} onChange={(e) => setTrailerId(e.target.value)}>
            <option value="">Select a trailer…</option>
            {trailers?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.plateNumber}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Assign
          </Button>
        </div>
      </form>
    </Modal>
  );
}
