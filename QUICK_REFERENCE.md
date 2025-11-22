# ⚡ Quick Reference Guide

**Schnellzugriff für häufige Aufgaben**

---

## 🔍 Status eines Users prüfen

```sql
-- User-Details abrufen
SELECT
  email,
  account_status,
  trial_ends_at,
  EXTRACT(DAY FROM (trial_ends_at - NOW())) as days_remaining,
  premium_since,
  data_deletion_scheduled_at
FROM user_profiles
WHERE email = 'user@example.com';
```

---

## 📊 Tägliche Statistiken

```sql
-- Heute's Zahlen
SELECT
  COUNT(*) FILTER (WHERE account_status = 'trial_active') as trials_active,
  COUNT(*) FILTER (WHERE DATE(trial_started_at) = CURRENT_DATE) as new_trials_today,
  COUNT(*) FILTER (WHERE DATE(trial_ends_at) = CURRENT_DATE) as expiring_today,
  COUNT(*) FILTER (WHERE account_status = 'premium_active') as premium_active,
  COUNT(*) * 49.99 FILTER (WHERE account_status = 'premium_active') as mrr
FROM user_profiles;
```

---

## 🛠️ Häufige Admin-Tasks

### Trial verlängern (7 Tage)
```sql
SELECT * FROM extend_trial_period(
  (SELECT id FROM user_profiles WHERE email = 'user@example.com'),
  7  -- Tage
);
```

### Premium manuell aktivieren
```sql
SELECT * FROM force_premium_activation(
  (SELECT id FROM user_profiles WHERE email = 'user@example.com'),
  'Support compensation for downtime'
);
```

### Löschung abbrechen
```sql
SELECT * FROM cancel_scheduled_deletion(
  (SELECT id FROM user_profiles WHERE email = 'user@example.com')
);
```

### Grace Period verlängern
```sql
SELECT * FROM extend_grace_period(
  (SELECT id FROM user_profiles WHERE email = 'user@example.com'),
  14  -- Tage
);
```

---

## 🚨 Problem-Diagnose

### Webhook-Fehler prüfen
```sql
SELECT
  processed_at,
  event_type,
  error_message
FROM stripe_webhook_logs
WHERE error_message IS NOT NULL
ORDER BY processed_at DESC
LIMIT 10;
```

### User mit inkonsistentem Status
```sql
SELECT
  email,
  account_status as stored_status,
  get_account_status(id) as computed_status
FROM user_profiles
WHERE account_status != get_account_status(id);
```

### Expired Trials ohne Lösch-Datum
```sql
SELECT email, trial_ends_at, account_status
FROM user_profiles
WHERE account_status = 'trial_expired'
  AND data_deletion_scheduled_at IS NULL;
```

---

## 📈 KPIs schnell abrufen

### System-Statistiken
```sql
SELECT jsonb_pretty(get_system_statistics());
```

### Conversion-Rate (letzte 30 Tage)
```sql
WITH trials AS (
  SELECT COUNT(*) as count
  FROM user_profiles
  WHERE trial_started_at >= NOW() - INTERVAL '30 days'
),
conversions AS (
  SELECT COUNT(*) as count
  FROM subscription_events
  WHERE event_type = 'upgrade_to_premium'
    AND created_at >= NOW() - INTERVAL '30 days'
)
SELECT
  trials.count as trials,
  conversions.count as conversions,
  ROUND(conversions.count * 100.0 / NULLIF(trials.count, 0), 2) as rate
FROM trials, conversions;
```

---

## 🔧 Maintenance-Tasks

### Expired Trials manuell markieren
```sql
UPDATE user_profiles
SET account_status = 'trial_expired'::account_status_type
WHERE account_status = 'trial_active'
  AND trial_ends_at <= NOW();
```

### Deletion-Dates setzen
```sql
UPDATE user_profiles
SET data_deletion_scheduled_at = trial_ends_at + INTERVAL '30 days'
WHERE account_status = 'trial_expired'
  AND data_deletion_scheduled_at IS NULL;
```

---

## 🎯 Test-Szenarien

### Test-User mit abgelaufenem Trial erstellen
```sql
-- 1. Registriere User normal über Frontend
-- 2. Dann manuell Trial ablaufen lassen:
UPDATE user_profiles
SET
  trial_ends_at = NOW() - INTERVAL '1 day',
  account_status = 'trial_expired'::account_status_type,
  data_deletion_scheduled_at = NOW() + INTERVAL '30 days'
WHERE email = 'test@example.com';
```

### Test-User mit Premium-Status erstellen
```sql
SELECT * FROM force_premium_activation(
  (SELECT id FROM user_profiles WHERE email = 'test@example.com'),
  'Testing'
);
```

---

## 📧 User-Listen für E-Mails

### Trial endet in 3 Tagen
```sql
SELECT email, trial_ends_at
FROM user_profiles
WHERE account_status = 'trial_active'
  AND trial_ends_at > NOW()
  AND trial_ends_at <= NOW() + INTERVAL '3 days';
```

### Löschung in 7 Tagen
```sql
SELECT email, data_deletion_scheduled_at
FROM user_profiles
WHERE data_deletion_scheduled_at IS NOT NULL
  AND data_deletion_scheduled_at > NOW()
  AND data_deletion_scheduled_at <= NOW() + INTERVAL '7 days';
```

---

## 🏥 Health-Check

### Schneller Health-Check
```sql
SELECT
  COUNT(*) FILTER (WHERE account_status = 'trial_active') as trials,
  COUNT(*) FILTER (WHERE account_status = 'premium_active') as premium,
  EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_account_status'
  ) as functions_exist,
  EXISTS (
    SELECT 1 FROM stripe_webhook_logs WHERE processed_at >= NOW() - INTERVAL '1 hour'
  ) as webhooks_working
FROM user_profiles;
```

### Vollständiger Health-Check
```sql
\i SYSTEM_HEALTH_CHECK.sql
```

---

## 💡 Nützliche Queries

### Top 10 neueste User
```sql
SELECT email, created_at, account_status, trial_ends_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 10;
```

### User ohne Stripe-Customer-ID
```sql
SELECT email, account_status, created_at
FROM user_profiles
WHERE stripe_customer_id IS NULL
  AND account_status != 'trial_active';
```

### Webhook-Events heute
```sql
SELECT
  event_type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE error_message IS NOT NULL) as errors
FROM stripe_webhook_logs
WHERE DATE(processed_at) = CURRENT_DATE
GROUP BY event_type;
```

---

## 🔐 Sicherheits-Checks

### RLS aktiv prüfen
```sql
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('guests', 'budget_items', 'vendors', 'tasks')
ORDER BY tablename;
-- Alle sollten rowsecurity = true haben
```

### Funktionen mit SECURITY DEFINER
```sql
SELECT
  proname,
  prosecdef
FROM pg_proc
WHERE proname IN (
  'get_account_status',
  'extend_trial_period',
  'force_premium_activation'
)
ORDER BY proname;
-- Alle sollten prosecdef = true haben
```

---

## 🎨 Frontend-Testing

### Lokaler Test mit verschiedenen Status
```javascript
// In Browser Console (nachdem eingeloggt):

// Aktuellen Status prüfen
const { data } = await supabase.rpc('check_trial_status');
console.log(data);

// Account-Status simulieren (nur für Testing!)
// WARNUNG: Nicht in Production verwenden!
await supabase
  .from('user_profiles')
  .update({ account_status: 'trial_expired' })
  .eq('id', (await supabase.auth.getUser()).data.user.id);
```

---

## 📱 Stripe Dashboard Quick-Links

- **Payments:** https://dashboard.stripe.com/payments
- **Subscriptions:** https://dashboard.stripe.com/subscriptions
- **Customers:** https://dashboard.stripe.com/customers
- **Webhooks:** https://dashboard.stripe.com/webhooks
- **Products:** https://dashboard.stripe.com/products
- **Test Mode:** https://dashboard.stripe.com/test/dashboard

---

## 🆘 Support-Szenarien

### Szenario 1: "Ich habe geupdatet, bin aber noch Read-Only"

**Diagnose:**
```sql
SELECT
  up.email,
  up.account_status,
  ss.status as stripe_status,
  se.event_type as last_event
FROM user_profiles up
LEFT JOIN stripe_customers sc ON sc.user_id = up.id
LEFT JOIN stripe_subscriptions ss ON ss.customer_id = sc.customer_id
LEFT JOIN LATERAL (
  SELECT event_type
  FROM subscription_events
  WHERE user_id = up.id
  ORDER BY created_at DESC
  LIMIT 1
) se ON true
WHERE up.email = 'user@example.com';
```

**Lösung:** Webhook-Logs prüfen, ggf. manuell aktivieren:
```sql
SELECT * FROM force_premium_activation(
  (SELECT id FROM user_profiles WHERE email = 'user@example.com'),
  'Webhook issue - manual activation'
);
```

### Szenario 2: "Ich brauche mehr Zeit"

```sql
-- Trial verlängern
SELECT * FROM extend_trial_period(
  (SELECT id FROM user_profiles WHERE email = 'user@example.com'),
  7
);
```

### Szenario 3: "Meine Zahlung ist fehlgeschlagen"

**Diagnose:**
```sql
SELECT *
FROM stripe_webhook_logs
WHERE user_id = (SELECT id FROM user_profiles WHERE email = 'user@example.com')
  AND event_type LIKE '%payment%'
ORDER BY processed_at DESC
LIMIT 5;
```

**Temporäre Lösung:**
```sql
-- Grace Period verlängern während User Payment-Problem löst
SELECT * FROM extend_grace_period(
  (SELECT id FROM user_profiles WHERE email = 'user@example.com'),
  7
);
```

---

## 📚 Weitere Ressourcen

| Thema | Datei |
|-------|-------|
| Vollständige Admin-Funktionen | ADMIN_GUIDE.md |
| Alle Monitoring-Queries | ADMIN_QUERIES.sql |
| System-Health-Check | SYSTEM_HEALTH_CHECK.sql |
| Deployment-Guide | DEPLOYMENT_QUICKSTART.md |
| Technische Übersicht | README_PREMIUM_SYSTEM.md |

---

**Bookmark diese Datei für schnellen Zugriff!** 📌
