import { useState } from "react";
import { useCompany } from "../context/useCompany";
import { useSubmit } from "../lib/useSubmit";
import { FormModal } from "./FormModal";
import { Field, Input } from "./Field";
import { companiesApi } from "../api/companies";
import type { Company } from "../types";

export function CompanySwitcher() {
  const { companies, currentCompany, selectCompany, refreshCompanies } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Company</label>
      <div className="flex items-center gap-1.5">
        <select
          className="w-full truncate rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          value={currentCompany?.id ?? ""}
          onChange={(e) => selectCompany(e.target.value)}
        >
          {companies.length === 0 && <option value="">No companies</option>}
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setIsCreateOpen(true)}
          title="Create company"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {isCreateOpen && (
        <CreateCompanyModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={async (id) => {
            await refreshCompanies();
            selectCompany(id);
            setIsCreateOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CreateCompanyModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState("");

  const { submit, isSubmitting, error } = useSubmit(
    (input: { name: string }) => companiesApi.create(input),
    (company: Company) => onCreated(company.id)
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit({ name }, "Failed to create company");
  }

  return (
    <FormModal
      title="Create company"
      onClose={onClose}
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Create company"
    >
      <Field label="Company name">
        <Input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Demo Transport Co." />
      </Field>
    </FormModal>
  );
}
