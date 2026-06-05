-- Database-enforced updated_at maintenance.
-- Guarantees updated_at advances on every UPDATE even for writes that bypass
-- the ORM (manual SQL, bulk maintenance). Tables without updated_at
-- (tracking_events, audit_logs are append-only) are intentionally excluded.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'tenants',
    'users',
    'roles',
    'permissions',
    'addresses',
    'shipments',
    'shipment_items',
    'delivery_attempts',
    'notifications'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;', t);
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t);
  END LOOP;
END
$$;
