-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN     "packageDetails" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "customerEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "customerName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "customerPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "shippingAddress" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "costPriceMinorUnits" INTEGER,
ADD COLUMN     "minStockThreshold" INTEGER NOT NULL DEFAULT 10;
