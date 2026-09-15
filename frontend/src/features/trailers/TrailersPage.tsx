import { useState } from "react";
import { useCompany } from "../../context/useCompany";
import { useApi } from "../../lib/useApi";
import { trailersApi } from "../../api/trailers";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Table, THead, TH, TBody, TR, TD } from "../../components/Table";
import { FullPageSpinner, ErrorBanner, EmptyState } from "../../components/Feedback";
import { StatusBadge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import { Field, Input } from "../../components/Field";
import type { TrailerStatus } from "../../types";

export function TrailersPage() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany!.id;
  const { data: trailers, isLoading, error, reload } = useApi(() => trailersApi.list(companyId), [companyId]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function toggleStatus(id: string, current: TrailerStatus) {
    await trailersApi.setStatus(companyId, id, current === "ACTIVE" ? "INACTIVE" : "ACTIVE");
    reload();
  }

  return (
    <div>
      <PageHeader
        title="Trailers"
        description="Only ACTIVE trailers can be attached to a vehicle."
        actions={<Button onClick={() => setIsCreateOpen(true)}>New trailer</Button>}
      />

      {isLoading ? (
        <FullPageSpinner />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !trailers || trailers.length === 0 ? (
        <EmptyState title="No trailers yet" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Plate #</TH>
              <TH>Type</TH>
              <TH align="right">Capacity (kg)</TH>
              <TH>Status</TH>
              <TH align="right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {trailers.map((t) => (
              <TR key={t.id}>
                <TD className="font-medium text-slate-900">{t.plateNumber}</TD>
                <TD>{t.trailerType ?? "—"}</TD>
                <TD align="right">{t.capacityKg ?? "—"}</TD>
                <TD>
                  <StatusBadge status={t.status} />
                </TD>
                <TD align="right">
                  <Button size="sm" variant="secondary" onClick={() => toggleStatus(t.id, t.status)}>
                    {t.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {isCreateOpen && (
        <CreateTrailerModal
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

function CreateTrailerModal({
  companyId,
  onClose,
  onCreated,
}: {
  companyId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [plateNumber, setPlateNumber] = useState("");
  const [trailerType, setTrailerType] = useState("");
  const [capacityKg, setCapacityKg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await trailersApi.create(companyId, {
        plateNumber,
        trailerType: trailerType || undefined,
        capacityKg: capacityKg || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trailer");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="New trailer" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <Field label="Plate number">
          <Input required value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
        </Field>
        <Field label="Type (optional)">
          <Input value={trailerType} onChange={(e) => setTrailerType(e.target.value)} placeholder="e.g. Flatbed" />
        </Field>
        <Field label="Capacity (kg, optional)">
          <Input type="number" value={capacityKg} onChange={(e) => setCapacityKg(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create trailer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
