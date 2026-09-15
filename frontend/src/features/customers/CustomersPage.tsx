import { useState } from "react";
import { useCompany } from "../../context/useCompany";
import { useApi } from "../../lib/useApi";
import { useSubmit } from "../../lib/useSubmit";
import { customersApi, type CreateCustomerInput } from "../../api/customers";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Table, THead, TH, TBody, TR, TD } from "../../components/Table";
import { FullPageSpinner, ErrorBanner, EmptyState } from "../../components/Feedback";
import { FormModal } from "../../components/FormModal";
import { Field, Input } from "../../components/Field";

export function CustomersPage() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany!.id;
  const { data: customers, isLoading, error, reload } = useApi(() => customersApi.list(companyId), [companyId]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Trips are created against a customer/contract."
        actions={<Button onClick={() => setIsCreateOpen(true)}>New customer</Button>}
      />

      {isLoading ? (
        <FullPageSpinner />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !customers || customers.length === 0 ? (
        <EmptyState title="No customers yet" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Contact info</TH>
            </tr>
          </THead>
          <TBody>
            {customers.map((c) => (
              <TR key={c.id}>
                <TD className="font-medium text-slate-900">{c.name}</TD>
                <TD className="text-slate-500">{c.contactInfo ?? "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {isCreateOpen && (
        <CreateCustomerModal
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

function CreateCustomerModal({
  companyId,
  onClose,
  onCreated,
}: {
  companyId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const { submit, isSubmitting, error } = useSubmit(
    (input: CreateCustomerInput) => customersApi.create(companyId, input),
    onCreated
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit({ name, contactInfo: contactInfo || undefined }, "Failed to create customer");
  }

  return (
    <FormModal
      title="New customer"
      onClose={onClose}
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Create customer"
    >
      <Field label="Name">
        <Input required value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Contact info (optional)">
        <Input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} />
      </Field>
    </FormModal>
  );
}
