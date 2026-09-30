/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "suppliers_email_key" ON "suppliers"("email");
