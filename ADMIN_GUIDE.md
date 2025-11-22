# Admin Guide - Premium-Only System

**Version:** 1.0
**Datum:** 15. November 2025

---

## 🎯 Übersicht

Dieses Dokument beschreibt die Admin-Tools und -Funktionen für das Premium-Only-System mit 14-Tage-Trial.

---

## 📊 Monitoring & Statistics

### System-Statistiken abrufen

```sql
SELECT * FROM get_system_statistics();
```

**Returns:**
```json
{
  "overview": {
    "total_users": 1250,
    "trial_active": 450,
    "trial_expired": 120,
    "premium_active": 680,
    "premium_cancelled": 0,
    "suspended": 0,
    "deleted": 0
  },
  "revenue": {
    "active_premium_users": 680,
    "monthly_recurring_revenue": 33993.20
  },
  "trials": {
    "expiring_today": 12,
    "expiring_this_week": 87,
    "new_trials_today": 34,
    "new_trials_this_week": 198
  },
  "deletions": {
    "scheduled_today": 3,
    "scheduled_this_week": 18
  },
  "conversions_30d": {
    "total_conversions": 145,
    "conversion_rate": 28.5
  }
}
```

### Wichtige Monitoring-Queries

Siehe `ADMIN_QUERIES.sql` für vollständige Liste. Wichtigste Queries:

**1. Trials expiring soon:**
```sql
SELECT
  up.email,
  EXTRACT(DAY FROM (up.trial_ends_at - NOW())) as days_remaining
FROM user_profiles up
WHERE up.account_status = 'trial_active'
  AND up.trial_ends_at <= NOW() + INTERVAL '7 days'
ORDER BY up.trial_ends_at ASC;
```

**2. Scheduled deletions:**
```sql
SELECT
  up.email,
  up.data_deletion_scheduled_at,
  EXTRACT(DAY FROM (up.data_deletion_scheduled_at - NOW())) as days_until_deletion
FROM user_profiles up
WHERE up.data_deletion_scheduled_at IS NOT NULL
  AND up.data_deletion_scheduled_at <= NOW() + INTERVAL '7 days'
ORDER BY up.data_deletion_scheduled_at ASC;
```

**3. Revenue overview:**
```sql
SELECT
  account_status,
  COUNT(*) as user_count,
  CASE
    WHEN account_status = 'premium_active' THEN COUNT(*) * 49.99
    ELSE 0
  END as revenue
FROM user_profiles
GROUP BY account_status
ORDER BY user_count DESC;
```

---

## 🛠️ Admin-Funktionen

### 1. Trial verlängern

Verlängert die Trial-Phase eines Users um X Tage.

```sql
-- 7 Tage hinzufügen (default)
SELECT * FROM extend_trial_period('user-uuid-here');

-- 14 Tage hinzufügen
SELECT * FROM extend_trial_period('user-uuid-here', 14);
```

**Use Cases:**
- User hat technische Probleme erlebt
- Support-Goodwill
- Testing/QA

**Response:**
```json
{
  "success": true,
  "old_trial_end": "2025-11-20T10:00:00Z",
  "new_trial_end": "2025-11-27T10:00:00Z",
  "days_added": 7
}
```

**Effekt:**
- ✅ Trial-End-Datum verschoben
- ✅ Status auf `trial_active` gesetzt
- ✅ Deletion cancelled
- ✅ Warnings zurückgesetzt
- ✅ Event in `subscription_events` geloggt

---

### 2. Grace Period verlängern

Verlängert die Frist vor der Datenlöschung um X Tage.

```sql
-- 7 Tage hinzufügen (default)
SELECT * FROM extend_grace_period('user-uuid-here');

-- 14 Tage hinzufügen
SELECT * FROM extend_grace_period('user-uuid-here', 14);
```

**Use Cases:**
- User braucht mehr Zeit zur Entscheidung
- Payment-Probleme werden gelöst
- Support-Kulanz

**Response:**
```json
{
  "success": true,
  "old_deletion_date": "2025-11-30T10:00:00Z",
  "new_deletion_date": "2025-12-07T10:00:00Z",
  "days_added": 7
}
```

**Effekt:**
- ✅ Deletion-Datum verschoben
- ✅ Warning-Counter zurückgesetzt
- ⚠️ User bleibt in Read-Only
- ✅ Event geloggt

---

### 3. Löschung abbrechen

Stoppt die geplante Datenlöschung für einen User.

```sql
SELECT * FROM cancel_scheduled_deletion('user-uuid-here');
```

**Use Cases:**
- User will Daten behalten, aber noch nicht upgraden
- Temporäre Ausnahme
- Support-Fall

**Response:**
```json
{
  "success": true,
  "message": "Deletion cancelled, but user remains in read-only mode"
}
```

**Effekt:**
- ✅ `data_deletion_scheduled_at` = NULL
- ✅ Warnings zurückgesetzt
- ⚠️ User bleibt in Read-Only (expired/cancelled)
- ✅ Event geloggt

---

### 4. Premium manuell aktivieren

Gibt einem User sofort Premium-Zugang (ohne Stripe).

```sql
-- Standard-Aktivierung
SELECT * FROM force_premium_activation('user-uuid-here');

-- Mit Grund
SELECT * FROM force_premium_activation(
  'user-uuid-here',
  'Support compensation for downtime'
);
```

**Use Cases:**
- Support-Kompensation
- Partner/Influencer-Accounts
- Testing/QA
- Sondervereinbarungen

**WARNUNG:** ⚠️ User wird NICHT in Stripe getracked! Manuelle Buchführung erforderlich.

**Response:**
```json
{
  "success": true,
  "old_status": "trial_expired",
  "new_status": "premium_active"
}
```

**Effekt:**
- ✅ Status auf `premium_active`
- ✅ `premium_since` gesetzt
- ✅ Deletion cancelled
- ✅ Voller Zugriff sofort
- ⚠️ Keine Stripe-Subscription
- ✅ Event geloggt

---

## 🔍 User-Lookup

### Komplette User-Details

```sql
SELECT
  up.id,
  up.email,
  up.account_status,
  get_account_status(up.id) as computed_status,
  is_read_only_mode(up.id) as is_read_only,
  up.trial_started_at,
  up.trial_ends_at,
  EXTRACT(DAY FROM (up.trial_ends_at - NOW())) as days_remaining,
  up.data_deletion_scheduled_at,
  up.warning_count,
  up.premium_since,
  up.stripe_customer_id,
  up.created_at
FROM user_profiles up
WHERE up.email = 'user@example.com';
```

### User's Subscription-Events

```sql
SELECT
  created_at,
  event_type,
  old_status,
  new_status,
  source,
  metadata
FROM subscription_events
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC
LIMIT 20;
```

### User's Stripe-Webhooks

```sql
SELECT
  processed_at,
  event_type,
  event_id,
  error_message,
  payload
FROM stripe_webhook_logs
WHERE user_id = 'user-uuid-here'
ORDER BY processed_at DESC
LIMIT 20;
```

---

## 🚨 Alert Thresholds

### Empfohlene Monitoring-Alerts

**1. Hohe Fehlerrate bei Webhooks**
```sql
-- Alert wenn > 5% Error-Rate
SELECT
  ROUND(
    COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) * 100.0 / COUNT(*),
    2
  ) as error_rate_percent
FROM stripe_webhook_logs
WHERE processed_at >= NOW() - INTERVAL '1 hour';
```
**Threshold:** > 5%

**2. Viele Trials expiring ohne Conversions**
```sql
-- Alert wenn < 20% Conversion-Rate
WITH trial_ends AS (
  SELECT COUNT(*) as count
  FROM user_profiles
  WHERE DATE(trial_ends_at) >= CURRENT_DATE - 7
    AND DATE(trial_ends_at) <= CURRENT_DATE
),
conversions AS (
  SELECT COUNT(*) as count
  FROM subscription_events
  WHERE event_type = 'upgrade_to_premium'
    AND created_at >= NOW() - INTERVAL '7 days'
)
SELECT
  ROUND(conversions.count * 100.0 / NULLIF(trial_ends.count, 0), 2) as conversion_rate
FROM trial_ends, conversions;
```
**Threshold:** < 20%

**3. Viele Failed Payments**
```sql
-- Alert wenn > 10 failed payments in 24h
SELECT COUNT(*) as failed_payments
FROM stripe_webhook_logs
WHERE event_type = 'invoice.payment_failed'
  AND processed_at >= NOW() - INTERVAL '24 hours';
```
**Threshold:** > 10

---

## 📧 E-Mail-Benachrichtigungen

### Trial-Ablauf-Warnung (3 Tage vorher)

**Trigger:** Trial endet in 3 Tagen
**Template:** "Deine Testphase endet bald"

**Query für E-Mail-Liste:**
```sql
SELECT
  email,
  EXTRACT(DAY FROM (trial_ends_at - NOW())) as days_remaining
FROM user_profiles
WHERE account_status = 'trial_active'
  AND trial_ends_at > NOW()
  AND trial_ends_at <= NOW() + INTERVAL '3 days'
  AND (last_warning_sent_at IS NULL OR last_warning_sent_at < NOW() - INTERVAL '1 day');
```

### Deletion-Warning (7, 3, 1 Tag vorher)

**Trigger:** Löschung in X Tagen
**Template:** "Deine Daten werden bald gelöscht"

**Query:**
```sql
SELECT
  email,
  data_deletion_scheduled_at,
  EXTRACT(DAY FROM (data_deletion_scheduled_at - NOW())) as days_remaining
FROM user_profiles
WHERE data_deletion_scheduled_at IS NOT NULL
  AND data_deletion_scheduled_at > NOW()
  AND (
    -- 7 Tage vorher
    DATE(data_deletion_scheduled_at) = CURRENT_DATE + INTERVAL '7 days'
    OR
    -- 3 Tage vorher
    DATE(data_deletion_scheduled_at) = CURRENT_DATE + INTERVAL '3 days'
    OR
    -- 1 Tag vorher
    DATE(data_deletion_scheduled_at) = CURRENT_DATE + INTERVAL '1 day'
  );
```

---

## 🔧 Maintenance Tasks

### Tägliche Tasks

**1. Expired Trials markieren:**
```sql
UPDATE user_profiles
SET account_status = 'trial_expired'::account_status_type
WHERE account_status = 'trial_active'
  AND trial_ends_at <= NOW();
```

**2. Deletion Dates setzen:**
```sql
UPDATE user_profiles
SET data_deletion_scheduled_at = trial_ends_at + INTERVAL '30 days'
WHERE account_status = 'trial_expired'
  AND data_deletion_scheduled_at IS NULL;
```

**3. Daten löschen (VORSICHT!):**
```sql
-- NUR nach manueller Überprüfung!
-- Erst testen mit SELECT:
SELECT
  up.email,
  up.data_deletion_scheduled_at
FROM user_profiles up
WHERE DATE(up.data_deletion_scheduled_at) = CURRENT_DATE
  AND up.account_status != 'deleted';

-- Dann löschen:
-- (Implementierung in separatem Cron-Job)
```

---

## 🔐 Sicherheit

### Admin-Funktionen schützen

Alle Admin-Funktionen sind `SECURITY DEFINER` und nur für:
- Database Owner
- Service Role
- Spezielle Admin-Rolle

**RLS:** Admin-Funktionen bypassen RLS (SECURITY DEFINER).

### Audit-Trail

Alle Admin-Aktionen werden geloggt in `subscription_events`:
- `source: 'manual'`
- `metadata` enthält Details
- User-ID + Timestamp

**Beispiel:**
```sql
SELECT *
FROM subscription_events
WHERE source = 'manual'
ORDER BY created_at DESC
LIMIT 50;
```

---

## 📈 Performance

### Index-Übersicht

Wichtige Indexes für Monitoring-Queries:
```sql
-- User Profiles
idx_user_profiles_account_status
idx_user_profiles_trial_ends_at
idx_user_profiles_data_deletion_scheduled_at
idx_user_profiles_trial_warning

-- Subscription Events
idx_subscription_events_user_id
idx_subscription_events_created_at

-- Stripe Webhook Logs
idx_stripe_webhook_logs_event_type
idx_stripe_webhook_logs_processed_at
```

### Query-Optimierung

Für große Datenmengen (>100k Users):
- Nutze `LIMIT` bei Listings
- Verwende Date-Ranges bei Aggregationen
- Materialized Views für Complex Reports

---

## 🆘 Troubleshooting

### Problem: User hat upgraded, aber noch Read-Only

**Diagnose:**
```sql
SELECT
  up.account_status,
  get_account_status(up.id) as computed_status,
  ss.status as stripe_status
FROM user_profiles up
LEFT JOIN stripe_customers sc ON sc.user_id = up.id
LEFT JOIN stripe_subscriptions ss ON ss.customer_id = sc.customer_id
WHERE up.email = 'user@example.com';
```

**Lösung:**
- Prüfe Stripe-Subscription-Status
- Prüfe Webhook-Logs auf Fehler
- Manuell korrigieren mit `force_premium_activation()`

### Problem: Trial endet nicht automatisch

**Diagnose:**
```sql
SELECT
  account_status,
  trial_ends_at,
  trial_ends_at <= NOW() as should_be_expired
FROM user_profiles
WHERE account_status = 'trial_active'
  AND trial_ends_at <= NOW();
```

**Lösung:**
- Manuell Status setzen:
```sql
UPDATE user_profiles
SET account_status = 'trial_expired'::account_status_type
WHERE id = 'user-uuid';
```

### Problem: Webhooks schlagen fehl

**Diagnose:**
```sql
SELECT
  event_type,
  error_message,
  payload
FROM stripe_webhook_logs
WHERE error_message IS NOT NULL
ORDER BY processed_at DESC
LIMIT 10;
```

**Lösung:**
- Prüfe Stripe-Webhook-Secret
- Prüfe Edge Function Logs
- Manuell Status korrigieren falls nötig

---

## 📞 Support-Workflows

### Workflow 1: User braucht mehr Zeit

1. User kontaktiert Support: "Ich brauche mehr Zeit"
2. Admin prüft User-Status
3. Admin entscheidet: Trial verlängern ODER Grace Period verlängern
4. Execute Function
5. User informieren

### Workflow 2: Payment-Problem

1. User meldet Failed Payment
2. Admin prüft Stripe-Dashboard + Webhook-Logs
3. Problem identifizieren (falsche Karte, Limit, etc.)
4. User hilft Problem zu lösen
5. Grace Period verlängern während Lösung
6. Stripe re-triggert Payment

### Workflow 3: Versehentliche Cancellation

1. User cancelt versehentlich
2. Admin prüft Subscription-Events
3. Prüfe ob noch innerhalb 24h
4. Stripe: Subscription reaktivieren
5. Oder: `force_premium_activation()` mit Notiz

---

## 🎯 Best Practices

1. **Logging:** Alle Admin-Aktionen dokumentieren
2. **Testing:** Auf Staging testen vor Production
3. **Backups:** Vor manuellen Bulk-Updates
4. **Communication:** User immer über Status-Änderungen informieren
5. **Monitoring:** Daily Stats-Check
6. **Alerts:** Set up für kritische Metriken

---

## 📚 Ressourcen

- **Migration:** `supabase/migrations/20251115180000_premium_only_system_no_free_tier.sql`
- **Queries:** `ADMIN_QUERIES.sql`
- **Functions:** Siehe oben
- **Edge Functions:** `supabase/functions/stripe-*`

---

**Ende Admin Guide v1.0**
