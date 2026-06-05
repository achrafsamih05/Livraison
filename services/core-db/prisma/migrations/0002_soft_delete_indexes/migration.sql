-- Soft-delete-aware uniqueness and active-row indexes.
-- Prisma cannot express partial indexes, so they are authored manually here.
-- These guarantee uniqueness only among non-deleted rows and accelerate the
-- common "active rows" query path.

-- Tenant slug is globally unique among non-deleted tenants.
CREATE UNIQUE INDEX "ux_tenants_slug_active"
  ON "tenants" ("slug")
  WHERE "deleted_at" IS NULL;

-- A user email is unique within a tenant among non-deleted users.
CREATE UNIQUE INDEX "ux_users_tenant_email_active"
  ON "users" ("tenant_id", lower("email"))
  WHERE "deleted_at" IS NULL;

-- A role key is unique within a tenant scope among non-deleted roles.
-- tenant_id NULL denotes a platform/system role; treated as its own scope via COALESCE.
CREATE UNIQUE INDEX "ux_roles_scope_key_active"
  ON "roles" (COALESCE("tenant_id", '00000000-0000-0000-0000-000000000000'::uuid), "key")
  WHERE "deleted_at" IS NULL;

-- AWB is globally unique among non-deleted shipments.
CREATE UNIQUE INDEX "ux_shipments_awb_active"
  ON "shipments" ("awb")
  WHERE "deleted_at" IS NULL;

-- Active-row partial indexes for hot list queries (exclude soft-deleted).
CREATE INDEX "ix_shipments_tenant_status_active"
  ON "shipments" ("tenant_id", "status", "created_at")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "ix_addresses_tenant_type_active"
  ON "addresses" ("tenant_id", "type")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "ix_notifications_pending"
  ON "notifications" ("tenant_id", "created_at")
  WHERE "status" = 'QUEUED' AND "deleted_at" IS NULL;

-- GIN indexes for JSONB filtering on metadata-heavy tables.
CREATE INDEX "ix_shipments_metadata_gin"
  ON "shipments" USING GIN ("metadata");

CREATE INDEX "ix_addresses_metadata_gin"
  ON "addresses" USING GIN ("metadata");
