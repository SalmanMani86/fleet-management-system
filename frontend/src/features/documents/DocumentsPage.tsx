import { useState } from "react";
import { useCompany } from "../../context/useCompany";
import { useApi } from "../../lib/useApi";
import { vehicleDocumentsApi } from "../../api/vehicleDocuments";
import { vehiclesApi } from "../../api/vehicles";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Table, THead, TH, TBody, TR, TD } from "../../components/Table";
import { FullPageSpinner, ErrorBanner, EmptyState } from "../../components/Feedback";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import { Field, Input, Select } from "../../components/Field";
import { formatDate, daysUntil } from "../../lib/format";
import type { DocumentType, Vehicle } from "../../types";

const DOCUMENT_TYPES: DocumentType[] = ["REGISTRATION", "INSURANCE", "INSPECTION", "PERMIT", "OTHER"];

export function DocumentsPage() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany!.id;
  const { data: vehicles } = useApi(() => vehiclesApi.list(companyId), [companyId]);
  const {
    data: expiring,
    isLoading,
    error,
    reload,
  } = useApi(() => vehicleDocumentsApi.listExpiring(companyId, 30), [companyId]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  function plateFor(vehicleId: string) {
    return vehicles?.find((v) => v.id === vehicleId)?.plateNumber ?? vehicleId;
  }

  return (
    <div>
      <PageHeader
        title="Vehicle Documents"
        description="Documents expiring within 30 days, or already expired, computed fresh on every load — not a stored alert that can go stale."
        actions={<Button onClick={() => setIsCreateOpen(true)}>New document</Button>}
      />

      {isLoading ? (
        <FullPageSpinner />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !expiring || expiring.length === 0 ? (
        <EmptyState title="No documents expiring soon" description="All tracked documents are valid for more than 30 days." />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Vehicle</TH>
              <TH>Type</TH>
              <TH>Document #</TH>
              <TH>Expiry</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {expiring.map((d) => {
              const days = daysUntil(d.expiryDate);
              return (
                <TR key={d.id}>
                  <TD className="font-medium text-slate-900">{plateFor(d.vehicleId)}</TD>
                  <TD>{d.documentType}</TD>
                  <TD>{d.documentNumber ?? "—"}</TD>
                  <TD>{formatDate(d.expiryDate)}</TD>
                  <TD>{days < 0 ? <Badge tone="rose">Expired</Badge> : <Badge tone="amber">Expires in {days}d</Badge>}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      {isCreateOpen && (
        <CreateDocumentModal
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

function CreateDocumentModal({
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
  const [documentType, setDocumentType] = useState<DocumentType>("REGISTRATION");
  const [documentNumber, setDocumentNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await vehicleDocumentsApi.create(companyId, {
        vehicleId,
        documentType,
        documentNumber: documentNumber || undefined,
        expiryDate,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create document");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="New vehicle document" onClose={onClose}>
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
        <Field label="Document type">
          <Select value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentType)}>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Document number (optional)">
          <Input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
        </Field>
        <Field label="Expiry date">
          <Input type="date" required value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create document
          </Button>
        </div>
      </form>
    </Modal>
  );
}
