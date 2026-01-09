-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('DEPLOY', 'RETURN');

-- CreateEnum
CREATE TYPE "CodeType" AS ENUM ('QR', 'BARCODE');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "codeValue" TEXT NOT NULL,
    "codeType" "CodeType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "codeValue" TEXT NOT NULL,
    "codeType" "CodeType" NOT NULL,
    "action" "ActionType",
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_codeValue_codeType_key" ON "Product"("codeValue", "codeType");

-- CreateIndex
CREATE INDEX "Scan_productId_idx" ON "Scan"("productId");

-- CreateIndex
CREATE INDEX "Scan_action_idx" ON "Scan"("action");

-- CreateIndex
CREATE INDEX "Scan_codeValue_codeType_idx" ON "Scan"("codeValue", "codeType");

-- CreateIndex
CREATE INDEX "Scan_createdAt_idx" ON "Scan"("createdAt");

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
