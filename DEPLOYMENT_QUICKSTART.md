# 🚀 Deployment Quick-Start Guide

**Geschätzte Zeit:** 30 Minuten
**Schwierigkeitsgrad:** Mittel

---

## ✅ Voraussetzungen

- [x] Supabase-Projekt erstellt
- [x] Stripe-Account aktiv
- [x] Node.js & npm installiert
- [x] Supabase CLI installiert
- [x] Git-Repository geklont

---

## 📝 Schritt 1: Environment Variables

### 1.1 Frontend (.env)

Erstelle `.env` im Projekt-Root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
```

### 1.2 Supabase Edge Functions

Edge Function Secrets (automatisch verfügbar):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Zusätzliche Secrets setzen:
```bash
# Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your-key

# Stripe Webhook Secret (später, nach Webhook-Erstellung)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your-secret
```

---

## 🗄️ Schritt 2: Datenbank-Migration

### 2.1 Supabase CLI Login

```bash
npx supabase login
```

### 2.2 Projekt verknüpfen

```bash
npx supabase link --project-ref your-project-ref
```

### 2.3 Migration anwenden

Die Migration wurde bereits via MCP-Tool angewendet. Zur Sicherheit prüfen:

```bash
# Prüfe ob Tabellen existieren
npx supabase db remote commit
```

Falls Migration noch nicht angewendet, manuell:
```bash
# Nur falls nötig!
npx supabase db push
```

### 2.4 Validierung

Prüfe in Supabase Dashboard → SQL Editor:

```sql
-- Prüfe Funktionen
SELECT proname FROM pg_proc
WHERE proname IN ('get_account_status', 'is_read_only_mode', 'check_trial_status', 'upgrade_to_premium');

-- Prüfe Tabellen
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('subscription_events', 'stripe_webhook_logs');

-- Prüfe ENUM
SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'account_status_type'::regtype;
```

**Erwartetes Ergebnis:**
- ✅ 4 Funktionen gefunden
- ✅ 2 Tabellen gefunden
- ✅ 6 ENUM-Werte (trial_active, trial_expired, premium_active, premium_cancelled, suspended, deleted)

---

## 🔧 Schritt 3: Edge Functions Deployment

### 3.1 stripe-webhook deployen

```bash
npx supabase functions deploy stripe-webhook
```

**Output:**
```
Deploying function stripe-webhook...
✓ Function deployed successfully
URL: https://your-project.supabase.co/functions/v1/stripe-webhook
```

### 3.2 stripe-checkout deployen

```bash
npx supabase functions deploy stripe-checkout
```

**Output:**
```
Deploying function stripe-checkout...
✓ Function deployed successfully
URL: https://your-project.supabase.co/functions/v1/stripe-checkout
```

### 3.3 Funktions-URLs notieren

**Wichtig:** Notiere beide URLs für später!
- Webhook URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- Checkout URL: `https://your-project.supabase.co/functions/v1/stripe-checkout`

---

## 💳 Schritt 4: Stripe konfigurieren

### 4.1 Product erstellen

1. Gehe zu [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Klicke "Add product"
3. Fülle aus:
   - **Name:** "Wedding Planner Premium"
   - **Description:** "Voller Zugriff auf alle Features"
   - **Pricing:**
     - Recurring
     - 49,99 EUR
     - Monthly
   - **Trial:** 14 days
4. Speichern & **Price ID** notieren (z.B. `price_1ABC...`)

### 4.2 Price ID in Edge Function

Die Price ID muss in `stripe-checkout/index.ts` eingetragen werden:

```typescript
// Zeile ~40
const price = 'price_1ABC...'; // DEINE PRICE ID HIER
```

Dann neu deployen:
```bash
npx supabase functions deploy stripe-checkout
```

### 4.3 Webhook einrichten

1. Gehe zu [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Klicke "Add endpoint"
3. Endpoint URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Events auswählen:
   ```
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   customer.subscription.trial_will_end
   invoice.payment_succeeded
   invoice.payment_failed
   ```
5. Speichern & **Signing Secret** kopieren (whsec_...)

### 4.4 Webhook Secret setzen

```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your-secret-here
```

### 4.5 Webhook testen

In Stripe Dashboard → Webhooks → Dein Endpoint → "Send test webhook"

Wähle Event: `customer.subscription.created`

**Prüfen:**
```sql
SELECT * FROM stripe_webhook_logs ORDER BY processed_at DESC LIMIT 5;
```

Sollte den Test-Event zeigen!

---

## 🎨 Schritt 5: Frontend Build & Deploy

### 5.1 Dependencies installieren

```bash
npm install
```

### 5.2 Build erstellen

```bash
npm run build
```

**Erwartetes Ergebnis:**
```
✓ built in ~20s
dist/index.html                2.01 kB
dist/assets/index-*.css      149.61 kB
dist/assets/index-*.js       1940.33 kB
```

### 5.3 Deploy

**Option A: Vercel**
```bash
npm install -g vercel
vercel
```

**Option B: Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Option C: Supabase Hosting** (falls verfügbar)
```bash
npx supabase deploy --project-id your-project-id
```

---

## ✅ Schritt 6: Finales Testing

### 6.1 Test-User erstellen

1. Öffne deine deployed App
2. Registriere dich mit Test-E-Mail
3. Prüfe in Supabase Dashboard → Table Editor → user_profiles

**Erwartete Werte:**
```
account_status: trial_active
trial_started_at: [jetzt]
trial_ends_at: [jetzt + 14 Tage]
```

### 6.2 Trial-Banner testen

1. Login mit Test-User
2. Sollte gelbes TrialBanner sehen mit "14 Tage verbleibend"
3. Im Dashboard navigieren

### 6.3 Upgrade-Flow testen

1. Klicke "Jetzt upgraden" im TrialBanner
2. PricingModal sollte öffnen
3. Klicke "Premium holen"
4. Stripe Checkout sollte öffnen
5. Nutze Stripe Test-Card: `4242 4242 4242 4242`
   - Expiry: Beliebiges Zukunftsdatum
   - CVC: Beliebige 3 Ziffern
   - ZIP: Beliebig
6. Payment abschließen

### 6.4 Premium-Status prüfen

Nach erfolgreichem Payment:

```sql
-- Prüfe User-Status
SELECT
  email,
  account_status,
  premium_since
FROM user_profiles
WHERE email = 'deine-test-email@example.com';
```

**Erwartet:**
```
account_status: premium_active
premium_since: [Zeitstempel]
```

### 6.5 Admin-Funktionen testen

```sql
-- System-Statistiken abrufen
SELECT * FROM get_system_statistics();

-- Trial verlängern (Test-User)
SELECT * FROM extend_trial_period('test-user-uuid', 7);

-- Premium-Status prüfen
SELECT * FROM check_trial_status();
```

---

## 📊 Schritt 7: Monitoring einrichten

### 7.1 Daily Stats Query

Erstelle Bookmark in Supabase Dashboard → SQL Editor:

```sql
-- Name: "Daily Stats"
SELECT
  CURRENT_DATE as date,
  COUNT(*) FILTER (WHERE account_status = 'trial_active') as trials_active,
  COUNT(*) FILTER (WHERE account_status = 'premium_active') as premium_active,
  COUNT(*) FILTER (WHERE DATE(trial_ends_at) = CURRENT_DATE) as trials_expiring_today,
  COUNT(*) * 49.99 FILTER (WHERE account_status = 'premium_active') as mrr
FROM user_profiles;
```

### 7.2 Webhook Health Check

```sql
-- Name: "Webhook Health"
SELECT
  event_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE error_message IS NOT NULL) as errors,
  ROUND(
    COUNT(*) FILTER (WHERE error_message IS NOT NULL) * 100.0 / COUNT(*),
    2
  ) as error_rate_percent
FROM stripe_webhook_logs
WHERE processed_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY total DESC;
```

### 7.3 Alerts konfigurieren (optional)

Verwende externe Tools wie:
- **Better Uptime:** Webhook-Monitoring
- **Datadog:** Custom Metrics
- **Sentry:** Error-Tracking
- **PostHog:** Analytics

---

## 🔐 Schritt 8: Security Checklist

- [x] **Environment Variables:** Niemals in Git committen
- [x] **Stripe Keys:** Test-Keys für Staging, Live-Keys nur für Production
- [x] **Webhook Secret:** Sicher in Supabase Secrets
- [x] **RLS Policies:** Alle Tabellen haben RLS enabled
- [x] **Service Role Key:** Nur in Edge Functions, niemals im Frontend
- [x] **CORS:** Nur erlaubte Origins
- [x] **Rate Limiting:** Stripe hat built-in Protection

---

## 📈 Schritt 9: Go-Live Checklist

### Pre-Launch
- [x] Alle Tests erfolgreich
- [x] Test-Payment durchgeführt
- [x] Trial-Flow getestet
- [x] Upgrade-Flow getestet
- [x] Admin-Funktionen getestet
- [x] Monitoring eingerichtet
- [x] Backup-Strategy definiert

### Launch Day
- [ ] Stripe auf Live-Mode umstellen
- [ ] Live Webhook erstellen
- [ ] Live Price-ID setzen
- [ ] Environment Variables auf Production
- [ ] Frontend neu deployen
- [ ] Erste Test-Registrierung
- [ ] Monitoring beobachten

### Post-Launch (Tag 1-7)
- [ ] Täglich Stats checken
- [ ] Webhook-Errors monitoren
- [ ] Conversion-Rate tracken
- [ ] User-Feedback sammeln
- [ ] Support-Anfragen dokumentieren

---

## 🆘 Troubleshooting

### Problem: Edge Function 404

**Lösung:**
```bash
# Neu deployen
npx supabase functions deploy stripe-webhook
npx supabase functions deploy stripe-checkout

# URLs prüfen
npx supabase functions list
```

### Problem: Webhook fails

**Diagnose:**
```sql
SELECT * FROM stripe_webhook_logs
WHERE error_message IS NOT NULL
ORDER BY processed_at DESC
LIMIT 10;
```

**Häufige Ursachen:**
- Falscher Webhook Secret
- Falsche Supabase URL
- Missing Service Role Key

### Problem: Trial endet nicht automatisch

**Manuelle Korrektur:**
```sql
UPDATE user_profiles
SET account_status = 'trial_expired'::account_status_type
WHERE account_status = 'trial_active'
  AND trial_ends_at <= NOW();
```

**Dauerhafte Lösung:** Cron-Job einrichten (siehe unten)

### Problem: User kann nicht upgraden

**Diagnose:**
```sql
-- Prüfe User-Status
SELECT
  email,
  account_status,
  stripe_customer_id
FROM user_profiles
WHERE email = 'user@example.com';

-- Prüfe Stripe-Subscription
SELECT * FROM stripe_subscriptions ss
JOIN stripe_customers sc ON sc.customer_id = ss.customer_id
WHERE sc.user_id = (SELECT id FROM user_profiles WHERE email = 'user@example.com');
```

**Lösung:** Force Premium Activation
```sql
SELECT * FROM force_premium_activation(
  (SELECT id FROM user_profiles WHERE email = 'user@example.com'),
  'Support case: payment issue resolved'
);
```

---

## 🤖 Optional: Cron-Jobs einrichten

### Supabase Cron (pg_cron)

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Daily: Expire trials
SELECT cron.schedule(
  'expire-trials-daily',
  '0 2 * * *',  -- 2 AM daily
  $$
    UPDATE user_profiles
    SET account_status = 'trial_expired'::account_status_type
    WHERE account_status = 'trial_active'
      AND trial_ends_at <= NOW();
  $$
);

-- Daily: Set deletion dates
SELECT cron.schedule(
  'set-deletion-dates-daily',
  '0 3 * * *',  -- 3 AM daily
  $$
    UPDATE user_profiles
    SET data_deletion_scheduled_at = trial_ends_at + INTERVAL '30 days'
    WHERE account_status = 'trial_expired'
      AND data_deletion_scheduled_at IS NULL;
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;
```

---

## 📚 Nächste Schritte

Nach erfolgreichem Deployment:

1. **Monitoring:** Täglich Stats überprüfen
2. **Analytics:** User-Behavior tracken
3. **Optimization:** Conversion-Funnel optimieren
4. **Support:** Team mit Admin-Guide schulen
5. **Marketing:** Launch-Kampagne starten

---

## ✅ Deployment Complete!

Wenn alle Schritte abgeschlossen sind, ist dein Premium-Only-System live! 🎉

**Support-Ressourcen:**
- ADMIN_GUIDE.md
- ADMIN_QUERIES.sql
- README_PREMIUM_SYSTEM.md

**Bei Fragen:** Siehe Troubleshooting oder ADMIN_GUIDE.md

---

**Geschätzte Gesamt-Zeit:** 30 Minuten
**Schwierigkeitsgrad:** ✅ Machbar
**Status:** 🚀 Ready to Deploy
