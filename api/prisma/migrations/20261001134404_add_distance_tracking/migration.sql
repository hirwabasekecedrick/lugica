-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN     "distanceMeters" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "driver_locations" ADD COLUMN     "cumulativeDistanceMeters" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "legDistanceMeters" DOUBLE PRECISION NOT NULL DEFAULT 0;
