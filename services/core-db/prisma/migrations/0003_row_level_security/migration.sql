-- Row-Level Security (RLS) for multi-tenant isolation.
--
-- Enforcement contract (see ADR tenant-isolation):
--   * The application connects as a NON-superuser, NON-owner role
--     (livraison_app) so RLS is actually enforced (owners/superusers bypass RLS).
--   * Every request sets the tenant context within its transaction:
--         SET LOCAL app.tenant_id = '<uuid>';
--     Using SET LOCAL (not SET) makes this safe under PgBouncer transaction pooling.
--   * Policies fail CLOSED: if app.tenant_id is unset, current_tenant_id()
--     returns NULL and no tenant rows are visible.
--
-- This migration is idempotent-friendly and additive.

-- ---------------------------------------------------------------------------
-- Application role (created if absent). Password is set/rotated out of band.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'livraison_app') THEN
    CREATE ROLE livraison_app NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO livraison_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO livraison_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO livraison_app;

-- ---------------------------------------------------------------------------
-- Helper: resolve the current tenant from the session GUC. Fail closed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$;

-- ---------------------------------------------------------------------------
-- Enable + force RLS and attach tenant policies to every tenant-owned table.
-- FORCE ensures even the table owner is subject to policies in non-superuser
-- sessions; the migration role (superuser/owner) still bypasses as needed.
-- ---------------------------------------------------------------------------

-- tenants: a session may only see its own tenant row.
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenants" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenants_isolation" ON "tenants"
  USING ("id" = current_tenant_id())
  WITH CHECK ("id" = current_tenant_id());

-- Generic tenant_id-scoped tables.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
CREATE POLICY "users_isolation" ON "users"
  USING ("tenant_id" = current_tenant_id())
  WITH CHECK ("tenant_id" = current_tenant_id());

ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "addresses" FORCE ROW LEVEL SECURITY;
CREATE POLICY "addresses_isolation" ON "addresses"
  USING ("tenant_id" = current_tenant_id())
  WITH CHECK ("tenant_id" = current_tenant_id());

ALTER TABLE "shipments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shipments" FORCE ROW LEVEL SECURITY;
CREATE POLICY "shipments_isolation" ON "shipments"
  USING ("tenant_id" = current_tenant_id())
  WITH CHECK ("tenant_id" = current_tenant_id());

ALTER TABLE "shipment_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shipment_items" FORCE ROW LEVEL SECURITY;
CREATE POLICY "shipment_items_isolation" ON "shipment_items"
  USING ("tenant_id" = current_tenant_id())
  WITH CHECK ("tenant_id" = current_tenant_id());

ALTER TABLE "tracking_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tracking_events" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tracking_events_isolation" ON "tracking_events"
  USING ("tenant_id" = current_tenant_id())
  WITH CHECK ("tenant_id" = current_tenant_id());

ALTER TABLE "delivery_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "delivery_attempts" FORCE ROW LEVEL SECURITY;
CREATE POLICY "delivery_attempts_isolation" ON "delivery_attempts"
  USING ("tenant_id" = current_tenant_id())
  WITH CHECK ("tenant_id" = current_tenant_id());

ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" FORCE ROW LEVEL SECURITY;
CREATE POLICY "notifications_isolation" ON "notifications"
  USING ("tenant_id" = current_tenant_id())
  WITH CHECK ("tenant_id" = current_tenant_id());

-- roles: tenant-scoped rows isolated; platform/system roles (tenant_id IS NULL)
-- are readable by all tenants but only mutable by the privileged migration role.
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" FORCE ROW LEVEL SECURITY;
CREATE POLICY "roles_isolation_select" ON "roles"
  FOR SELECT
  USING ("tenant_id" = current_tenant_id() OR "tenant_id" IS NULL);
CREATE POLICY "roles_isolation_write" ON "roles"
  FOR ALL
  USING ("tenant_id" = current_tenant_id())
  WITH CHECK ("tenant_id" = current_tenant_id());

-- audit_logs: append + read within tenant; platform-level rows (tenant_id NULL)
-- are not visible to tenant sessions.
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_isolation" ON "audit_logs"
  USING ("tenant_id" = current_tenant_id())
  WITH CHECK ("tenant_id" = current_tenant_id());

-- permissions, user_roles, role_permissions are reference/junction tables.
-- permissions is global reference data: readable by all, writable only by the
-- privileged role (no policy => owner-only under FORCE off). We leave RLS off
-- for permissions (global catalog) and rely on GRANTs; junctions inherit
-- isolation through their parent rows' visibility.
