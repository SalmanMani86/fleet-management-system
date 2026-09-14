-- Enforce at most one OPEN (effective_to IS NULL) assignment per vehicle,
-- at the database level. This is the hard backstop behind the service-layer
-- row-lock check: even if two requests race past the application check,
-- Postgres itself refuses a second concurrently-open assignment row.
CREATE UNIQUE INDEX "vehicle_assignments_one_open_per_vehicle"
  ON "vehicle_assignments" ("vehicle_id")
  WHERE "effective_to" IS NULL;

CREATE UNIQUE INDEX "trailer_assignments_one_open_per_vehicle"
  ON "trailer_assignments" ("vehicle_id")
  WHERE "effective_to" IS NULL;
