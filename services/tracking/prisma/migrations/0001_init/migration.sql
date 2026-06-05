-- Required for gen_random_uuid().
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('CREATED', 'PICKUP_PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TrackingEventType" AS ENUM ('CREATED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'ARRIVED_AT_HUB', 'DEPARTED_HUB', 'ARRIVED_AT_BRANCH', 'OUT_FOR_DELIVERY', 'DELIVERY_ATTEMPTED', 'DELIVERED', 'FAILED', 'RETURNED', 'HELD', 'EXCEPTION', 'CANCELLED', 'NOTE');

-- CreateEnum
CREATE TYPE "EventSource" AS ENUM ('SYSTEM', 'DRIVER_APP', 'WAREHOUSE', 'PARTNER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'SYNC');

-- CreateTable
CREATE TABLE "tracking_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "type" "TrackingEventType" NOT NULL,
    "source" "EventSource" NOT NULL DEFAULT 'SYSTEM',
    "status_after" "ShipmentStatus",
    "description" TEXT,
    "location" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "actor_id" UUID,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_tracking_state" (
    "shipment_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "current_status" "ShipmentStatus" NOT NULL,
    "last_event_id" UUID,
    "last_event_type" "TrackingEventType",
    "last_occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "event_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shipment_tracking_state_pkey" PRIMARY KEY ("shipment_id")
);

-- CreateTable
CREATE TABLE "tracking_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID,
    "action" "AuditAction" NOT NULL,
    "shipment_id" UUID,
    "tracking_number" TEXT,
    "actor_id" UUID,
    "actor_type" TEXT NOT NULL DEFAULT 'system',
    "detail" JSONB NOT NULL DEFAULT '{}',
    "ip_address" TEXT,
    "request_id" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tracking_events_tenant_id_shipment_id_occurred_at_idx" ON "tracking_events"("tenant_id", "shipment_id", "occurred_at");

-- CreateIndex
CREATE INDEX "tracking_events_tenant_id_tracking_number_occurred_at_idx" ON "tracking_events"("tenant_id", "tracking_number", "occurred_at");

-- CreateIndex
CREATE INDEX "tracking_events_shipment_id_occurred_at_idx" ON "tracking_events"("shipment_id", "occurred_at");

-- CreateIndex
CREATE INDEX "tracking_events_tenant_id_type_occurred_at_idx" ON "tracking_events"("tenant_id", "type", "occurred_at");

-- CreateIndex
CREATE INDEX "shipment_tracking_state_tenant_id_current_status_idx" ON "shipment_tracking_state"("tenant_id", "current_status");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_tracking_state_tenant_id_tracking_number_key" ON "shipment_tracking_state"("tenant_id", "tracking_number");

-- CreateIndex
CREATE INDEX "tracking_audit_logs_tenant_id_occurred_at_idx" ON "tracking_audit_logs"("tenant_id", "occurred_at");

-- CreateIndex
CREATE INDEX "tracking_audit_logs_shipment_id_occurred_at_idx" ON "tracking_audit_logs"("shipment_id", "occurred_at");

-- CreateIndex
CREATE INDEX "tracking_audit_logs_action_occurred_at_idx" ON "tracking_audit_logs"("action", "occurred_at");
