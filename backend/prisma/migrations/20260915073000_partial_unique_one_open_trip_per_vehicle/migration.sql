-- Enforce at most one OPEN trip (PLANNED or IN_PROGRESS) per vehicle at the
-- database level. Backstops the service-layer check in createTrip: even if
-- two requests race past the application check simultaneously, Postgres
-- refuses a second concurrently-open trip row for the same vehicle.
CREATE UNIQUE INDEX "trips_one_open_per_vehicle"
  ON "trips" ("vehicle_id")
  WHERE "status" IN ('PLANNED', 'IN_PROGRESS');
