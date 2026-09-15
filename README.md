# Fleet Management System

A Fleet Management backend and frontend built for a take-home engineering assessment.
The brief: design and implement a professional Fleet Management system covering vehicles,
drivers, trailers, documents, maintenance, fuel, assignments, and trips, with correct
historical behavior under reassignment and a decoupled integration story with
Payroll/Accounting.

## Stack

- **Backend**: Node.js, TypeScript, Express, Prisma, PostgreSQL, Zod, Vitest
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, React Router v7

Both follow the same conventions as a sibling ERP Accounting project this was built
alongside: company-scoped multi-tenancy, Prisma transactions for every multi-step write,
audit logging inside those transactions, idempotency keys on trip creation, and pure
domain logic kept separate from Express/Prisma code.

## Project structure

```
backend/
  prisma/schema.prisma       12 domain tables + companies + audit_logs
  prisma/migrations/         includes two hand-written partial unique indexes
  src/domain/                pure state-machine logic, no Prisma/Express (unit tested)
  src/lib/                   shared Prisma client, error types, scoped lookups, idempotency
  src/middleware/            company-context resolution, error handling
  src/modules/<name>/        one folder per module: *.service.ts, *.controller.ts, *.routes.ts
  src/routes/index.ts        single composition root for the whole API surface
  tests/integration/         tests against a real Postgres database

frontend/
  src/api/<name>.ts          thin typed client per backend module
  src/features/<name>/       one folder per screen (list + create modal)
  src/components/            shared UI (Button, Card, Table, Modal, Field, Badge)
  src/context/               CompanyProvider for tenant switching
```

## Setup

### 1. Database

Requires a PostgreSQL instance reachable from the backend. Create a role and database:

```sql
CREATE ROLE fleet LOGIN PASSWORD 'fleet' CREATEDB;
CREATE DATABASE fleet_management OWNER fleet;
```

### 2. Backend

```bash
cd backend
cp .env.example .env    # DATABASE_URL, PORT — defaults match the role/db above
npm install
npx prisma migrate deploy   # applies all migrations, including the two hand-written
                             # partial unique indexes (see "Constraints" below)
npm run dev                 # starts on http://localhost:4001
```

Run the test suite (needs the same database reachable):

```bash
npm test
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env    # VITE_API_BASE_URL, defaults to http://localhost:4001/api
npm install
npm run dev              # prints the local URL (Vite auto-picks a free port)
```

Open the printed URL, then use the "+" next to the Company selector in the sidebar to
create your first company — nothing renders until at least one company exists.

## Data model

Twelve domain tables plus `companies` (tenant root) and `audit_logs` (append-only):

`vehicle_models`, `vehicles`, `drivers`, `trailers`, `vehicle_assignments`,
`trailer_assignments`, `vehicle_documents`, `maintenance_records`,
`maintenance_status_logs`, `fuel_records`, `customers`, `trips`.

### Key design decision: no mutable "current state" columns

The brief's core engineering question is "what is the source of truth for the current
vehicle driver?" The answer here is deliberately **not** a `currentDriverId` column on
`Vehicle`. Instead, `vehicle_assignments` (and `trailer_assignments`) are time-bounded,
append-only tables:

```
vehicle_assignments: { vehicleId, driverId, effectiveFrom, effectiveTo }
```

"Current driver" is the row for that vehicle where `effectiveTo IS NULL`. Reassigning a
vehicle is a transaction that closes the existing open row (stamps `effectiveTo`) and
opens a new one — both writes commit together or not at all. Nothing is ever deleted or
overwritten, so the full history of who drove a vehicle, and when, is always
reconstructable.

Trip creation resolves the driver (and trailer) from the vehicle's *current* open
assignment and copies those IDs onto the Trip row as a snapshot — not a live reference.
This is what makes reassignment safe: if a vehicle is later given to a different driver,
every trip already created keeps the driver it actually had at the time, including
completed trips. This exact scenario (assign → trip → reassign → verify history) is
covered end-to-end in `tests/integration/assignmentAndTrip.test.ts`.

### Constraints enforced at the database level, not just in application code

Two rules are backed by Postgres partial unique indexes, in addition to a service-layer
transaction check, so a race between two concurrent requests can't create an
inconsistent state:

- At most one **open vehicle assignment** per vehicle (`vehicle_assignments` /
  `trailer_assignments`, `WHERE effective_to IS NULL`)
- At most one **open trip** per vehicle (`trips`, `WHERE status IN ('PLANNED',
  'IN_PROGRESS')`) — a vehicle can't be given two simultaneous in-flight trips

### Other business rules worth knowing

- **Inactive vehicles/drivers/trailers** cannot be assigned or used in a new trip —
  enforced via `findActiveVehicleOrThrow` / `findActiveDriverOrThrow` at every write path
  that matters, not a UI-level checkbox.
- **Maintenance status changes** are written to an append-only
  `maintenance_status_logs` table on every transition (the brief's explicit
  auditability requirement), and moving a record to `IN_PROGRESS` puts the vehicle into
  `MAINTENANCE` status automatically.
- **Fuel records linked to a trip** have their `driverId` derived and locked from that
  trip's own driver — a client cannot submit a fuel record that contradicts the trip it
  claims to be linked to.
- **Trip loading/delivery points are required**, not optional — the brief lists
  "record loading and delivery information" as its own step in the trip workflow.
- **Idempotency keys** on trip creation prevent duplicate processing if a client retries
  a request; enforced by a unique constraint on `(companyId, idempotencyKey)`.

## Testing

26 automated tests: a handful of pure unit tests against the domain state machines
(`src/domain/*.test.ts`, no database needed) and integration tests that run against a
real Postgres database (`tests/integration/*.test.ts`), including the brief's own
Integration Test scenario verified line-by-line.
