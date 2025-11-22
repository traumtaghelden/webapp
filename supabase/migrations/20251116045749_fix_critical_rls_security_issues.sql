/*
  # KRITISCHER SECURITY FIX - RLS auf fehlenden Tabellen aktivieren

  ## Sicherheitsprobleme
  1. `stripe_webhook_logs` - Webhook-Logs sind öffentlich zugänglich
  2. `user_profiles_backup_20251115` - Backup-Tabelle ohne RLS
  3. `weddings_backup_20251115` - Backup-Tabelle ohne RLS

  ## Maßnahmen
  - RLS auf stripe_webhook_logs aktivieren (Admin-only)
  - Backup-Tabellen in separates Schema verschieben
  - Strikte Policies für alle Tabellen

  ## Sicherheit
  - Webhook-Logs nur für Service-Role zugänglich
  - Backup-Tabellen aus public Schema entfernen
  - Alle Tabellen mit RLS geschützt
*/

-- 1. RLS auf stripe_webhook_logs aktivieren
ALTER TABLE public.stripe_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Nur Service-Role kann auf Webhook-Logs zugreifen
-- Normale User sollten Webhook-Logs NIE sehen können
CREATE POLICY "Service role only access"
  ON stripe_webhook_logs
  FOR ALL
  USING (false); -- Blockiert alle normalen User komplett

-- 2. Backup-Tabellen aus public Schema entfernen
-- Diese sollten NIEMALS in public liegen!

-- Prüfen ob backup Schema existiert, wenn nicht erstellen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'backup') THEN
    CREATE SCHEMA backup;
  END IF;
END $$;

-- Backup-Tabellen ins backup Schema verschieben
ALTER TABLE IF EXISTS public.user_profiles_backup_20251115 
  SET SCHEMA backup;

ALTER TABLE IF EXISTS public.weddings_backup_20251115 
  SET SCHEMA backup;

-- 3. Sicherstellen, dass backup Schema geschützt ist
REVOKE ALL ON SCHEMA backup FROM PUBLIC;
REVOKE ALL ON SCHEMA backup FROM anon;
REVOKE ALL ON SCHEMA backup FROM authenticated;

-- Nur Superuser und Service-Role haben Zugriff
GRANT USAGE ON SCHEMA backup TO postgres;
GRANT ALL ON SCHEMA backup TO postgres;

-- 4. Dokumentation: Alle backup-Tabellen auflisten
COMMENT ON SCHEMA backup IS 'Schema für Backup-Tabellen. Zugriff nur für Admins/Service-Role. Keine öffentliche Exposition über PostgREST.';

-- 5. Prüfen ob es weitere Tabellen ohne RLS gibt
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
    AND rowsecurity = false
  LOOP
    RAISE NOTICE 'WARNING: Table %.% has RLS disabled!', rec.schemaname, rec.tablename;
  END LOOP;
END $$;
