-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shippingLat" DOUBLE PRECISION,
ADD COLUMN     "shippingLng" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "saved_locations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_locations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "saved_locations" ADD CONSTRAINT "saved_locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
