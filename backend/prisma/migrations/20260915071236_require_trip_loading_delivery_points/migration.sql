/*
  Warnings:

  - Made the column `loading_point` on table `trips` required. This step will fail if there are existing NULL values in that column.
  - Made the column `delivery_point` on table `trips` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "trips" ALTER COLUMN "loading_point" SET NOT NULL,
ALTER COLUMN "delivery_point" SET NOT NULL;
