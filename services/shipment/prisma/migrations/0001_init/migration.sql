-- Required for gen_random_uuid().
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('CREATED', 'PICKUP_PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceLevel" AS ENUM ('SAME_DAY', 'NEXT_DAY', 'EXPRESS', 'STANDARD', 'ECONOMY');

-- CreateTable
CREATE TABLE "shipments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'CREATED',
    "service" "ServiceLevel" NOT NULL DEFAULT 'STANDARD',
    "sender_name" TEXT NOT NULL,
    "sender_phone" TEXT NOT NULL,
    "sender_line1" TEXT NOT NULL,
    "sender_city" TEXT NOT NULL,
    "sender_country" CHAR(2) NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "recipient_phone" TEXT NOT NULL,
    "recipient_line1" TEXT NOT NULL,
    "recipient_city" TEXT NOT NULL,
    "recipient_country" CHAR(2) NOT NULL,
    "weight_grams" INTEGER NOT NULL DEFAULT 0,
    "cod_amount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "declared_value" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'SAR',
    "reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "from_status" "ShipmentStatus",
    "to_status" "ShipmentStatus" NOT NULL,
    "reason" TEXT,
    "actor_id" UUID,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shipments_tenant_id_status_created_at_idx" ON "shipments"("tenant_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "shipments_tenant_id_created_at_idx" ON "shipments"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "shipment_status_history_tenant_id_shipment_id_occurred_at_idx" ON "shipment_status_history"("tenant_id", "shipment_id", "occurred_at");

-- CreateIndex
CREATE INDEX "shipment_status_history_shipment_id_occurred_at_idx" ON "shipment_status_history"("shipment_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "shipment_status_history" ADD CONSTRAINT "shipment_status_history_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tracking number is globally unique among non-deleted shipments (soft-delete aware).
CREATE UNIQUE INDEX "ux_shipments_tracking_active"
  ON "shipments" ("tracking_number")
  WHERE "deleted_at" IS NULL;
