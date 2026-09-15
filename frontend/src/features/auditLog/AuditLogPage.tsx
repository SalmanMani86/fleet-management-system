import { useCompany } from "../../context/useCompany";
import { useApi } from "../../lib/useApi";
import { auditLogApi } from "../../api/auditLog";
import { PageHeader } from "../../components/PageHeader";
import { Table, THead, TH, TBody, TR, TD } from "../../components/Table";
import { FullPageSpinner, ErrorBanner, EmptyState } from "../../components/Feedback";
import { formatDateTime } from "../../lib/format";

export function AuditLogPage() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany!.id;
  const { data: logs, isLoading, error } = useApi(() => auditLogApi.list(companyId), [companyId]);

  return (
    <div>
      <PageHeader title="Audit Log" description="Append-only record of every state-changing action across the fleet." />

      {isLoading ? (
        <FullPageSpinner />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !logs || logs.length === 0 ? (
        <EmptyState title="No audit log entries yet" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Action</TH>
              <TH>Entity</TH>
              <TH>When</TH>
            </tr>
          </THead>
          <TBody>
            {logs.map((l) => (
              <TR key={l.id}>
                <TD className="font-medium text-slate-900">{l.action}</TD>
                <TD className="text-slate-500">
                  {l.entityType} · {l.entityId.slice(0, 8)}
                </TD>
                <TD>{formatDateTime(l.createdAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
