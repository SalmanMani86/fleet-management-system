import type { ReactElement } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useCompany } from "../context/useCompany";
import { FullPageSpinner, ErrorBanner } from "./Feedback";
import { CompanySwitcher } from "./CompanySwitcher";

const NAV_SECTIONS: { label: string; items: { to: string; label: string; icon: ReactElement }[] }[] = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Vehicles", icon: <TruckIcon /> }],
  },
  {
    label: "Fleet Setup",
    items: [
      { to: "/vehicle-models", label: "Vehicle Models", icon: <BookIcon /> },
      { to: "/drivers", label: "Drivers", icon: <UsersIcon /> },
      { to: "/trailers", label: "Trailers", icon: <TrailerIcon /> },
      { to: "/customers", label: "Customers", icon: <BuildingIcon /> },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/trips", label: "Trips", icon: <RouteIcon /> },
      { to: "/maintenance", label: "Maintenance", icon: <WrenchIcon /> },
      { to: "/fuel", label: "Fuel", icon: <FuelIcon /> },
      { to: "/documents", label: "Documents", icon: <DocIcon /> },
    ],
  },
  {
    label: "Insights",
    items: [{ to: "/audit-log", label: "Audit Log", icon: <ShieldIcon /> }],
  },
];

export function Layout() {
  const { isLoading, error, currentCompany } = useCompany();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            FM
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Fleet Management</p>
            <p className="text-xs text-slate-400">Assessment build</p>
          </div>
        </div>

        <div className="border-b border-slate-100 px-4 py-3">
          <CompanySwitcher />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-brand-50 text-brand-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`
                    }
                  >
                    <span className="h-4 w-4 shrink-0">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          {isLoading ? (
            <FullPageSpinner />
          ) : error ? (
            <ErrorBanner message={error} />
          ) : !currentCompany ? (
            <ErrorBanner message="No company selected. Create a company to get started." />
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16V7a1 1 0 011-1h9v10M3 16a2 2 0 104 0M3 16h13m0-10h2.5l3.5 4v6h-2m-4 0a2 2 0 104 0m-4 0H9m8 0h2" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" />
    </svg>
  );
}
function TrailerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17h13V6H3v11zm13-8h4l3 3v5h-7M6 20a2 2 0 104 0 2 2 0 00-4 0zm11 0a2 2 0 104 0 2 2 0 00-4 0z" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V5a1 1 0 011-1h5a1 1 0 011 1v16M13 21v-8a1 1 0 011-1h5a1 1 0 011 1v8M8 7h.01M8 11h.01M8 15h.01" />
    </svg>
  );
}
function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}
function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.77z" />
    </svg>
  );
}
function FuelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 22h11M6 22V4a1 1 0 011-1h5a1 1 0 011 1v18M6 10h7m3-5l3 3v7a1.5 1.5 0 01-3 0v-2a1 1 0 00-1-1h-1" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
