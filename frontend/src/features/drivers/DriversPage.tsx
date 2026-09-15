import { useState } from "react";
import { useCompany } from "../../context/useCompany";
import { useApi } from "../../lib/useApi";
import { useSubmit } from "../../lib/useSubmit";
import { driversApi, type CreateDriverInput } from "../../api/drivers";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Table, THead, TH, TBody, TR, TD } from "../../components/Table";
import { FullPageSpinner, ErrorBanner, EmptyState } from "../../components/Feedback";
import { StatusBadge } from "../../components/Badge";
import { FormModal } from "../../components/FormModal";
import { Field, Input } from "../../components/Field";
import { formatDate } from "../../lib/format";
import type { DriverStatus } from "../../types";

export function DriversPage() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany!.id;
  const { data: drivers, isLoading, error, reload } = useApi(() => driversApi.list(companyId), [companyId]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function toggleStatus(id: string, current: DriverStatus) {
    await driversApi.setStatus(companyId, id, current === "ACTIVE" ? "INACTIVE" : "ACTIVE");
    reload();
  }

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="Only ACTIVE drivers can be assigned to a vehicle or resolved onto a new trip."
        actions={<Button onClick={() => setIsCreateOpen(true)}>New driver</Button>}
      />

      {isLoading ? (
        <FullPageSpinner />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !drivers || drivers.length === 0 ? (
        <EmptyState title="No drivers yet" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>License #</TH>
              <TH>License expiry</TH>
              <TH>Phone</TH>
              <TH>Status</TH>
              <TH align="right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {drivers.map((d) => (
              <TR key={d.id}>
                <TD className="font-medium text-slate-900">{d.fullName}</TD>
                <TD>{d.licenseNumber}</TD>
                <TD>{formatDate(d.licenseExpiry)}</TD>
                <TD>{d.phone ?? "—"}</TD>
                <TD>
                  <StatusBadge status={d.status} />
                </TD>
                <TD align="right">
                  <Button size="sm" variant="secondary" onClick={() => toggleStatus(d.id, d.status)}>
                    {d.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {isCreateOpen && (
        <CreateDriverModal
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

function CreateDriverModal({
  companyId,
  onClose,
  onCreated,
}: {
  companyId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [phone, setPhone] = useState("");

  const { submit, isSubmitting, error } = useSubmit(
    (input: CreateDriverInput) => driversApi.create(companyId, input),
    onCreated
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(
      { fullName, licenseNumber, licenseExpiry: licenseExpiry || undefined, phone: phone || undefined },
      "Failed to create driver"
    );
  }

  return (
    <FormModal title="New driver" onClose={onClose} onSubmit={handleSubmit} error={error} isSubmitting={isSubmitting} submitLabel="Create driver">
      <Field label="Full name">
        <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="License number">
        <Input required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
      </Field>
      <Field label="License expiry (optional)">
        <Input type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} />
      </Field>
      <Field label="Phone (optional)">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
    </FormModal>
  );
}
