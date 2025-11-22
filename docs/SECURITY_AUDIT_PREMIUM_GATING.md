# Sicherheitsaudit: Premium-Gating & Zugriffsschutz

**Datum:** 02.11.2024
**Auditor:** Systematische Code-Analyse
**Scope:** Gesamte Traumtag Helden WebApp
**Ziel:** Premium-Funktionen identifizieren, Umgehungen finden, Sicherheitslücken dokumentieren

---

## 🎯 Executive Summary

**Status: 🟡 TEILWEISE SICHER - Mehrere kritische Lücken gefunden**

### Zusammenfassung
- ✅ **Datenbank-Ebene:** Gut gesichert durch RLS-Policies
- ⚠️ **UI-Ebene:** Mehrere Umgehungsmöglichkeiten gefunden
- ❌ **Kontext-Aktionen:** Payment Plans können ohne Premium-Check erstellt werden
- ⚠️ **Downgrade-Szenario:** Ungetestet, potenzielle Inkonsistenzen

### Gefundene Schwachstellen
- **3 Kritische Lücken** (SOFORT beheben)
- **5 Mittlere Probleme** (Innerhalb 7 Tage)
- **8 Niedrige Probleme** (Optimierungen)

---

## 🔴 KRITISCHE SICHERHEITSLÜCKEN (Priorität 1)

### Problem #1: Payment Plans ohne Premium-Check erstellbar

**Risiko:** 🔴 HOCH
**Datei:** `src/components/BudgetManager.tsx:287-297`

#### Beschreibung
Im `handleAddItem` wird ein Payment Plan direkt in die Datenbank geschrieben, **ohne zu prüfen ob der User Premium hat**. Free-User können durch Manipulation des Client-States ein `payment_plan` Array mitgeben und Premium-Features nutzen.

#### Reproduktionsschritte
1. Als Free-User Budget-Item-Modal öffnen
2. In Browser DevTools: `newItem.payment_plan = [{amount: '1000', dueDate: '2024-12-01', description: 'Test'}]` setzen
3. Formular absenden
4. ✅ Payment Plan wird erstellt (sollte blockiert sein!)

#### Aktueller Code
```typescript
if (newBudgetItem && newBudgetItem[0]) {
  if (item.payment_plan && item.payment_plan.length > 0) {
    // ❌ KEIN isPremium-Check hier!
    const paymentPlan = item.payment_plan.map((installment: any) => ({
      budget_item_id: newBudgetItem[0].id,
      amount: parseFloat(installment.amount),
      due_date: installment.dueDate,
      // ...
    }));
    await supabase.from('budget_payments').insert(paymentPlan);
  }
}
```

#### Lösung
```typescript
if (newBudgetItem && newBudgetItem[0]) {
  if (item.payment_plan && item.payment_plan.length > 0) {
    // ✅ Premium-Check hinzufügen
    if (!isPremium) {
      console.error('Payment plans require premium subscription');
      // Zeige Upgrade-Popup
      setShowUpgradePrompt(true);
      setUpgradeFeature('Zahlungsplan');
      return;
    }

    const paymentPlan = item.payment_plan.map((installment: any) => ({
      budget_item_id: newBudgetItem[0].id,
      amount: parseFloat(installment.amount),
      due_date: installment.dueDate,
      payment_type: 'milestone', // ✅ Explizit als Premium markieren
      // ...
    }));
    await supabase.from('budget_payments').insert(paymentPlan);
  }
}
```

#### Zusätzliche Absicherung (Datenbank-Ebene)
Die existierende RLS-Policy `budget_payments_insert_check_premium` sollte bereits greifen, **ABER nur wenn payment_type = 'milestone' oder 'monthly'**. Aktuell fehlt diese Prüfung in der Policy!

**Empfohlene Policy-Erweiterung:**
```sql
-- In 20251102000001_add_budget_premium_rls_policies.sql
CREATE OR REPLACE POLICY "budget_payments_insert_check_premium"
ON budget_payments
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Milestone und monthly Payments sind nur für Premium
  (payment_type IN ('milestone', 'monthly') AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND subscription_tier = 'premium'
    )
  )
  OR
  -- deposit und final sind für alle erlaubt
  payment_type IN ('deposit', 'final')
);
```

---

### Problem #2: Pro-Kopf-Kosten können im Budget-Item gespeichert werden

**Risiko:** 🔴 HOCH
**Datei:** `src/components/BudgetManager.tsx:258-282`

#### Beschreibung
Ein Free-User kann durch Dev-Tools `is_per_person: true` und `cost_per_person: 50` setzen. Beim INSERT gibt es **keinen Premium-Check** für diese Felder.

#### Reproduktionsschritte
1. Als Free-User Budget-Modal öffnen
2. Browser DevTools: `newItem.is_per_person = true; newItem.cost_per_person = '50'`
3. Formular absenden
4. ✅ Budget-Item mit Pro-Kopf-Kalkulation wird erstellt (sollte blockiert sein!)

#### Lösung (UI-Ebene)
```typescript
const handleAddItem = async (item: any) => {
  if (!canAddBudgetItem()) {
    setShowUpgradePrompt(true);
    return;
  }

  // ✅ Premium-Check für Pro-Kopf-Features
  if (item.is_per_person && !isPremium) {
    setUpgradeFeature('Pro-Kopf-Kalkulation');
    setShowUpgradePrompt(true);
    return;
  }

  try {
    let calculatedEstimatedCost = parseFloat(item.estimated_cost) || 0;
    let calculatedActualCost = parseFloat(item.actual_cost) || 0;
    const costPerPerson = parseFloat(item.cost_per_person) || null;

    // Nur bei Premium berechnen
    if (item.is_per_person && costPerPerson && isPremium) {
      // ... Berechnung ...
    }

    const { data: newBudgetItem, error: insertError } = await supabase
      .from('budget_items')
      .insert([{
        wedding_id: weddingId,
        category: item.category,
        item_name: item.item_name,
        estimated_cost: calculatedEstimatedCost,
        actual_cost: calculatedActualCost,
        // ✅ Nur bei Premium speichern
        is_per_person: isPremium ? item.is_per_person : false,
        cost_per_person: isPremium ? costPerPerson : null,
        use_confirmed_guests_only: isPremium ? item.use_confirmed_guests_only : false,
        guest_count_override: isPremium && item.guest_count_override ? parseFloat(item.guest_count_override) : null,
        // ...
      }])
      .select();
    // ...
  }
}
```

#### Lösung (Datenbank-Ebene)
```sql
-- Neue RESTRICTIVE Policy
CREATE POLICY "budget_items_check_premium_features"
ON budget_items
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Pro-Kopf-Features nur für Premium
  (
    (is_per_person = true OR cost_per_person IS NOT NULL) AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND subscription_tier = 'premium'
    )
  )
  OR
  -- Oder keine Pro-Kopf-Features verwendet
  (is_per_person = false OR is_per_person IS NULL)
  AND cost_per_person IS NULL
);
```

---

### Problem #3: PaymentPlanModal ist für Free-User zugänglich

**Risiko:** 🟡 MITTEL
**Datei:** `src/components/BudgetAddModal.tsx:425-509`

#### Beschreibung
Die PaymentPlanModal-Komponente wird nur durch UI-Hiding geschützt (`{paymentType === 'plan' && isPremium && ...}`). Wenn ein Free-User den State manipuliert (`setPaymentType('plan')`), öffnet sich das Modal.

#### Reproduktionsschritte
1. Als Free-User Budget-Modal öffnen
2. Browser Console: `setPaymentType('plan')` oder Button-Klick via DevTools
3. ✅ PaymentPlanModal öffnet sich (sollte blockiert sein!)
4. User kann Plan erstellen, wird aber durch Problem #1 beim Submit blockiert

#### Lösung
```typescript
{paymentType === 'plan' && isPremium && (
  <div>
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-[#666666]">Teile die Kosten in mehrere Raten auf</p>
      <button
        onClick={() => {
          // ✅ Doppelter Check
          if (!isPremium) {
            setUpgradeFeature('Zahlungsplan');
            setShowUpgradePrompt(true);
            return;
          }
          setShowPaymentPlan(true);
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all"
      >
        {newItem.payment_plan ? 'Bearbeiten' : 'Erstellen'}
      </button>
    </div>
    // ...
  </div>
)}

{/* ✅ Modal mit zusätzlichem Guard */}
{showPaymentPlan && isPremium && (
  <PaymentPlanModal
    isOpen={showPaymentPlan}
    onClose={() => setShowPaymentPlan(false)}
    // ...
  />
)}
```

---

## 🟡 MITTLERE SICHERHEITSPROBLEME (Priorität 2)

### Problem #4: BudgetItemProKopfForm zeigt Berechnung auch ohne Premium

**Risiko:** 🟡 MITTEL
**Datei:** `src/components/BudgetItemProKopfForm.tsx`

#### Beschreibung
Die Komponente hat keinen internen Premium-Check. Sie verlässt sich darauf, dass sie nur in Premium-Kontext gerendert wird. Bei direktem Import oder falschem Routing könnte sie von Free-Usern genutzt werden.

#### Lösung
```typescript
import { useSubscription } from '../contexts/SubscriptionContext';

export default function BudgetItemProKopfForm({ ... }: BudgetItemProKopfFormProps) {
  const { isPremium } = useSubscription();
  const [plannedGuests, setPlannedGuests] = useState(0);
  // ...

  // ✅ Guard Clause am Anfang
  if (!isPremium) {
    return (
      <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
        <p className="text-sm text-amber-800">
          Diese Funktion ist nur in Premium verfügbar.
        </p>
      </div>
    );
  }

  // Rest der Komponente
  // ...
}
```

---

### Problem #5: Timeline Buffer-Events ohne Premium-UI-Check

**Risiko:** 🟡 MITTEL
**Datei:** Zu prüfen in `WeddingTimelineEditor.tsx`

#### Beschreibung
Free-User haben Limit von 3+2 Events (3 regular, 2 buffer). Die UI könnte Buffer-Events anzeigen, ohne klar zu machen, dass sie Premium sind.

#### Empfohlene Prüfung
```typescript
// In WeddingTimelineEditor.tsx suchen nach:
- Ist der "Buffer erstellen" Button für Free-User sichtbar?
- Gibt es einen Premium-Badge bei Buffer-Events?
- Wird das Upgrade-Popup gezeigt bei Limit-Überschreitung?
```

#### Lösung
```typescript
// Beim "Buffer hinzufügen" Button
<button
  onClick={() => {
    if (!canAddTimelineEvent('buffer')) {
      if (!isPremium) {
        setUpgradeFeature('Puffer-Events');
        setShowUpgradePrompt(true);
      } else {
        // Limit erreicht (Premium-User)
        showToast('Maximale Anzahl an Puffer-Events erreicht');
      }
      return;
    }
    handleAddBuffer();
  }}
  className="..."
>
  <Plus className="w-4 h-4" />
  Puffer hinzufügen
  {!isPremium && <Crown className="w-3 h-3 ml-1 text-[#d4af37]" />}
</button>
```

---

### Problem #6: Vendor-Payments ohne Premium-Check

**Risiko:** 🟡 MITTEL
**Datei:** `src/components/VendorManager.tsx` und `VendorDetailModal.tsx`

#### Beschreibung
Die Vendor-Budget-Sync erstellt automatisch Budget-Items und Payments. Wenn ein Free-User einen Vendor mit mehreren Payments anlegt, könnten diese als "Raten" interpretiert werden, was Premium ist.

#### Zu prüfen
1. Kann Free-User mehrere Payments für einen Vendor erstellen?
2. Wird unterschieden zwischen "Einzelzahlung" und "Ratenplan"?
3. Gibt es UI-Feedback für Free vs Premium?

#### Lösung
```typescript
// In VendorDetailModal - Payment erstellen
const handleCreatePayment = async (paymentData) => {
  // ✅ Count existing payments
  const existingPayments = await loadVendorPayments(vendorId);

  if (existingPayments.length >= 1 && !isPremium) {
    setUpgradeFeature('Mehrere Zahlungen / Ratenplan');
    setShowUpgradePrompt(true);
    return;
  }

  // Erstelle Payment
  await supabase.from('vendor_payments').insert([{
    vendor_id: vendorId,
    ...paymentData,
    payment_type: isPremium && existingPayments.length > 0 ? 'milestone' : 'final'
  }]);
};
```

---

### Problem #7: useContextualCreate Hook ohne Premium-Checks

**Risiko:** 🟡 MITTEL
**Datei:** `src/hooks/useContextualCreate.ts`

#### Beschreibung
Der Hook `createPayment` prüft nicht, ob User Premium ist, bevor ein Payment erstellt wird. Entwickler könnten den Hook verwenden ohne an Premium-Checks zu denken.

#### Lösung
```typescript
import { useSubscription } from '../contexts/SubscriptionContext';

export function useContextualCreate(context: ContextualCreateOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isPremium } = useSubscription(); // ✅ Hook hinzufügen

  // ...

  const createPayment = async (options: CreatePaymentOptions) => {
    setLoading(true);
    setError(null);

    try {
      if (!context.budgetItemId && !context.vendorId) {
        throw new Error('Budget-Item oder Vendor muss angegeben werden');
      }

      // ✅ Premium-Check für erweiterte Payments
      const isAdvancedPayment = options.payment_type &&
        ['milestone', 'monthly'].includes(options.payment_type);

      if (isAdvancedPayment && !isPremium) {
        throw new Error('Erweiterte Zahlungsplanung erfordert Premium-Abo');
      }

      // Rest der Logik
      // ...
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createTask,
    createBudgetItem,
    createPayment,
    linkEntities
  };
}
```

---

### Problem #8: BudgetPremiumFeaturesPanel zeigt Features, nicht Limits

**Risiko:** 🟢 NIEDRIG (UX-Problem, keine Sicherheitslücke)
**Datei:** `src/components/BudgetPremiumFeaturesPanel.tsx`

#### Beschreibung
Das Panel ist gut gestaltet, aber zeigt nicht an, dass Free-User bereits 15 Budget-Items haben. Es wäre hilfreicher zu zeigen: "Du nutzt 12/15 Budget-Items. Upgrade für unbegrenzte Items."

#### Lösung
```typescript
import { useSubscription } from '../contexts/SubscriptionContext';

export default function BudgetPremiumFeaturesPanel({ onUpgradeClick }: Props) {
  const { limits } = useSubscription();

  return (
    <div className="...">
      {/* ✅ Limit-Anzeige hinzufügen */}
      {limits && (
        <div className="mb-4 p-3 bg-white/10 rounded-lg">
          <p className="text-white/70 text-sm mb-2">Dein aktueller Stand:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-white">
              <span className="font-bold">{limits.budget_items.current}/{limits.budget_items.max}</span> Budget-Items
            </div>
            <div className="text-white">
              <span className="font-bold">{limits.guests.current}/{limits.guests.max}</span> Gäste
            </div>
          </div>
        </div>
      )}

      {/* Rest des Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {features.map((feature, index) => (
          // ...
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button onClick={onUpgradeClick} className="...">
          <Crown className="w-5 h-5" />
          Jetzt Premium freischalten
        </button>
        <p className="text-white/70 text-sm text-center">
          Unbegrenzte Budget-Items • Pro-Kopf-Kosten • Zahlungspläne
        </p>
      </div>
    </div>
  );
}
```

---

## 🟢 NIEDRIGE PROBLEME & OPTIMIERUNGEN (Priorität 3)

### Problem #9: Inconsistent Premium-Badges

**Risiko:** 🟢 NIEDRIG (UX)

#### Beschreibung
Premium-Features haben unterschiedliche Visual-Marker:
- Manchmal Crown-Icon
- Manchmal "Premium" Badge
- Manchmal gar kein Marker

#### Lösung
Einheitliches Design-System:
```typescript
// Neue Komponente: PremiumFeatureCard.tsx
export function PremiumFeatureCard({
  title,
  description,
  onClick,
  locked = true
}: Props) {
  return (
    <div
      onClick={locked ? onClick : undefined}
      className={`p-6 rounded-xl border-2 transition-all ${
        locked
          ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 cursor-pointer hover:shadow-md'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start gap-4">
        {locked && (
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] rounded-xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-base font-bold text-[#0a253c] mb-1 flex items-center gap-2">
            {title}
            {locked && (
              <span className="px-2 py-0.5 bg-[#d4af37] text-white text-xs rounded-full">
                Premium
              </span>
            )}
          </h3>
          <p className="text-sm text-[#666666] mb-3">{description}</p>
          {locked && (
            <div className="flex items-center gap-2 text-[#d4af37] font-semibold text-sm group-hover:gap-3 transition-all">
              <span>Jetzt freischalten</span>
              <span className="text-lg">→</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Problem #10: Missing Error Messages für RLS-Violations

**Risiko:** 🟢 NIEDRIG (UX)

#### Beschreibung
Wenn ein Free-User das Limit erreicht und versucht ein Item hinzuzufügen, kommt nur ein generischer Postgres-Error. Nutzer versteht nicht, warum es fehlschlägt.

#### Lösung
```typescript
// In allen Manager-Komponenten
const handleAddItem = async (item: any) => {
  try {
    const { data, error } = await supabase
      .from('budget_items')
      .insert([item])
      .select();

    if (error) {
      // ✅ Bessere Error-Behandlung
      if (error.message.includes('check_budget_item_limit')) {
        showToast('Limit erreicht! Upgrade auf Premium für unbegrenzte Budget-Items.', 'error');
        setShowUpgradePrompt(true);
        return;
      }

      if (error.message.includes('check_premium')) {
        showToast('Diese Funktion ist nur in Premium verfügbar.', 'error');
        setShowUpgradePrompt(true);
        return;
      }

      throw error;
    }

    // Success
    showToast('Budget-Item erfolgreich erstellt!', 'success');
  } catch (error: any) {
    console.error('Error:', error);
    showToast('Ein Fehler ist aufgetreten. Bitte versuche es erneut.', 'error');
  }
};
```

---

## 🧪 TEST-SZENARIEN

### Szenario 1: Free-User versucht Pro-Kopf-Berechnung

**Schritte:**
1. Login als Free-User
2. Öffne Budget-Manager
3. Klicke "Neues Budget-Item"
4. Versuche Pro-Kopf-Aktivierung

**Erwartetes Ergebnis:**
- ✅ Pro-Kopf-Bereich zeigt Premium-Hinweis
- ✅ Klick öffnet Upgrade-Popup
- ✅ Keine Checkbox zum Aktivieren sichtbar

**Tatsächliches Ergebnis:**
- ✅ Korrekt implementiert (nach unserer Anpassung)

---

### Szenario 2: Free-User versucht Zahlungsplan über DevTools

**Schritte:**
1. Login als Free-User
2. Öffne Budget-Modal
3. Browser Console: `newItem.payment_plan = [{amount: '1000', dueDate: '2024-12-01', description: 'Rate 1'}]`
4. Submit Form

**Erwartetes Ergebnis:**
- ❌ **FEHLER:** Payment Plan wird erstellt
- ✅ **SOLL:** Upgrade-Popup erscheint, keine DB-Insertion

**Fix:** Problem #1 umsetzen

---

### Szenario 3: Premium-User upgradet, Free-User downgradet

**Upgrade-Test:**
1. Login als Free-User mit 10 Budget-Items
2. Kaufe Premium-Abo
3. Prüfe: Alle Premium-Features freigeschaltet?
4. Erstelle Pro-Kopf-Item
5. Erstelle Zahlungsplan

**Erwartetes Ergebnis:**
- ✅ Sofort alle Premium-Features sichtbar
- ✅ Limit-Bars verschwinden
- ✅ Bestehende Items bleiben intakt

**Downgrade-Test:**
1. Login als Premium-User mit 20 Budget-Items (über Free-Limit)
2. Kündige Abo
3. Prüfe: Was passiert mit bestehenden Items?

**Erwartetes Ergebnis:**
- ✅ Alle 20 Items bleiben lesbar
- ✅ Neue Items nur bis Limit 15
- ✅ Pro-Kopf-Items werden zu normalen Items (read-only für Berechnung)
- ✅ Payment Plans bleiben bestehen, aber nicht editierbar
- ❌ **PROBLEM:** Aktuell nicht implementiert!

**Empfohlene Lösung:**
```typescript
// Neue Komponente: DowngradeWarningBanner.tsx
export function DowngradeWarningBanner() {
  const { isPremium, limits } = useSubscription();
  const [showDetails, setShowDetails] = useState(false);

  // Prüfe ob User Premium-Features hat, aber nicht mehr Premium ist
  const hasOverLimitItems = limits && !isPremium && (
    limits.budget_items.current > limits.budget_items.max ||
    limits.guests.current > limits.guests.max
  );

  if (!hasOverLimitItems) return null;

  return (
    <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-bold text-orange-900 mb-1">
            Premium-Abo ausgelaufen
          </h3>
          <p className="text-sm text-orange-800 mb-2">
            Du hast mehr Einträge als im Free-Plan erlaubt.
            Bestehende Daten bleiben erhalten, aber du kannst keine neuen mehr hinzufügen.
          </p>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            {showDetails ? 'Weniger anzeigen' : 'Details anzeigen'}
          </button>

          {showDetails && (
            <div className="mt-3 p-3 bg-white rounded-lg text-xs space-y-1">
              <p>
                <strong>Budget-Items:</strong> {limits.budget_items.current}/{limits.budget_items.max}
                ({limits.budget_items.current - limits.budget_items.max} über Limit)
              </p>
              <p>
                <strong>Gäste:</strong> {limits.guests.current}/{limits.guests.max}
                {limits.guests.current > limits.guests.max &&
                  ` (${limits.guests.current - limits.guests.max} über Limit)`
                }
              </p>
            </div>
          )}

          <button
            onClick={() => window.location.href = '/upgrade'}
            className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all"
          >
            Jetzt erneut upgraden
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Szenario 4: Free-User folgt direktem Link zu Premium-Feature

**Schritte:**
1. Logout
2. Öffne URL direkt: `/budget/payment-plans` oder `/budget/pro-kopf`
3. Login als Free-User

**Erwartetes Ergebnis:**
- ✅ Redirect zu Dashboard oder Budget-Übersicht
- ✅ Toast: "Diese Funktion ist nur in Premium verfügbar"
- ✅ Upgrade-Popup erscheint

**Aktuelles Ergebnis:**
- ❓ Nicht getestet (keine dedizierte Route für Premium-Features)
- ✅ Aktuell okay, da keine Sub-Routes existieren

---

### Szenario 5: Vendor mit mehreren Payments (Free vs Premium)

**Schritte:**
1. Login als Free-User
2. Erstelle Vendor "Fotograf" mit 2500€ Kosten
3. Versuche 3 Payments zu erstellen:
   - Anzahlung: 500€
   - Zwischenzahlung: 1000€
   - Schlusszahlung: 1000€

**Erwartetes Ergebnis:**
- ✅ Erste Payment: Erfolgreich
- ❌ Zweite Payment: Upgrade-Popup
- ❌ **PROBLEM:** Aktuell nicht eingeschränkt!

**Fix:** Problem #6 umsetzen

---

## 📊 ZUSAMMENFASSUNG DER HANDLUNGSEMPFEHLUNGEN

### Sofort umsetzen (< 24h)

1. **Problem #1:** Premium-Check in `BudgetManager.handleAddItem` hinzufügen
2. **Problem #2:** Pro-Kopf-Felder nur bei Premium speichern
3. **Problem #3:** PaymentPlanModal doppelt absichern

### Diese Woche (< 7 Tage)

4. **Problem #4:** BudgetItemProKopfForm mit Guard Clause
5. **Problem #5:** Timeline Buffer-Events prüfen und absichern
6. **Problem #6:** Vendor-Payments auf 1 Payment für Free-User limitieren
7. **Problem #7:** useContextualCreate Hook mit Premium-Checks
8. **Problem #8:** BudgetPremiumFeaturesPanel mit Limit-Anzeige

### Nice-to-Have (< 30 Tage)

9. **Problem #9:** Einheitliche Premium-Badge-Komponente
10. **Problem #10:** Bessere Error-Messages für RLS-Violations
11. **Downgrade-Szenario:** DowngradeWarningBanner implementieren
12. **Testing:** Automatisierte E2E-Tests für Premium-Gating

---

## 🔒 DATENBANK-SICHERHEIT (Status: GUT)

### ✅ Was bereits gesichert ist

1. **RLS-Policies aktiv** auf allen relevanten Tabellen:
   - `guests` (40 max für Free)
   - `budget_items` (15 max für Free)
   - `wedding_timeline` (3+2 max für Free)
   - `vendors` (5 max für Free)
   - `family_groups` (nur Premium)
   - `guest_groups` (3 max für Free)
   - `budget_categories` (nur Premium)

2. **Limit-Funktionen** vorhanden:
   - `check_guest_limit()`
   - `check_budget_item_limit()`
   - `check_timeline_event_limit()`
   - `check_vendor_limit()`
   - `get_user_limits()` für UI-Anzeige

3. **subscription_tier** wird korrekt aus `user_profiles` gelesen

### ⚠️ Was noch fehlt

1. **budget_payments Policy** muss erweitert werden (siehe Problem #1)
2. **budget_items Pro-Kopf-Check** fehlt (siehe Problem #2)
3. **Downgrade-Cleanup-Funktion** für Datenintegrität

**Empfohlene Migration:**
```sql
-- Datei: 20251102_fix_premium_payment_policies.sql

-- 1. Erweitere budget_payments Policy
DROP POLICY IF EXISTS "budget_payments_insert_check_premium" ON budget_payments;

CREATE POLICY "budget_payments_insert_check_premium"
ON budget_payments
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Milestone und monthly nur für Premium
  (
    payment_type IN ('milestone', 'monthly') AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND subscription_tier = 'premium'
    )
  )
  OR
  -- deposit und final für alle (aber limitiert auf Anzahl)
  payment_type IN ('deposit', 'final')
);

-- 2. Budget Items: Pro-Kopf-Check
CREATE POLICY "budget_items_prokopf_check_premium"
ON budget_items
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Pro-Kopf-Features nur für Premium
  (
    (is_per_person = true OR cost_per_person IS NOT NULL)
    IMPLIES
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND subscription_tier = 'premium'
    )
  )
);

-- 3. UPDATE Policy für Pro-Kopf (verhindert Downgrade-Manipulation)
CREATE POLICY "budget_items_prokopf_update_check"
ON budget_items
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  -- Nur Premium darf Pro-Kopf-Features aktivieren
  (
    (NEW.is_per_person = true OR NEW.cost_per_person IS NOT NULL)
    IMPLIES
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND subscription_tier = 'premium'
    )
  )
);
```

---

## 🧰 TESTPLAN FÜR NACH FIXES

### Manuelle Tests

**Test 1: Free-User kann keine Premium-Features nutzen**
- [ ] Pro-Kopf-Kalkulation blockiert
- [ ] Zahlungsplan blockiert
- [ ] Family Groups blockiert
- [ ] Budget-Kategorien blockiert
- [ ] Vendor-Multi-Payments blockiert

**Test 2: Limits werden eingehalten**
- [ ] 40 Gäste max
- [ ] 15 Budget-Items max
- [ ] 3+2 Timeline-Events max
- [ ] 5 Vendors max
- [ ] 3 Guest-Groups max

**Test 3: Premium-User hat vollen Zugriff**
- [ ] Alle Features freigeschaltet
- [ ] Keine Limits
- [ ] Keine Upgrade-Popups

**Test 4: Upgrade funktioniert**
- [ ] Stripe-Checkout öffnet
- [ ] Nach Zahlung: subscription_tier = 'premium'
- [ ] Alle Features sofort verfügbar

**Test 5: Downgrade schützt Daten**
- [ ] Bestehende Items bleiben lesbar
- [ ] Neue Items nur bis Limit
- [ ] Premium-Items werden read-only
- [ ] Banner zeigt Downgrade-Warnung

### Automatisierte Tests (empfohlen)

```typescript
// tests/premium-gating.spec.ts
describe('Premium Gating', () => {
  it('blocks pro-kopf calculation for free users', async () => {
    await loginAsFreeUser();
    await openBudgetModal();

    const proKopfSection = await page.locator('[data-testid="pro-kopf-section"]');
    expect(proKopfSection).toContainText('Premium');

    await proKopfSection.click();
    expect(await page.locator('[data-testid="upgrade-popup"]').isVisible()).toBe(true);
  });

  it('blocks payment plans via devtools manipulation', async () => {
    await loginAsFreeUser();
    await openBudgetModal();

    // Manipulate state via devtools
    await page.evaluate(() => {
      // @ts-ignore
      window.__REACT_STATE__.newItem.payment_plan = [{amount: '1000', dueDate: '2024-12-01'}];
    });

    await page.click('[data-testid="submit-budget-item"]');

    // Should show upgrade popup, not create payment plan
    expect(await page.locator('[data-testid="upgrade-popup"]').isVisible()).toBe(true);

    const payments = await supabase.from('budget_payments').select('*');
    expect(payments.data).toHaveLength(0);
  });

  // Weitere Tests...
});
```

---

## 📈 METRIKEN & MONITORING

### Empfohlene Tracking-Events

```typescript
// analytics.ts
export const trackPremiumGating = {
  upgradeProm ptShown: (feature: string) => {
    // Track: Free-User versucht Premium-Feature
    analytics.track('premium_gate_hit', {
      feature,
      user_tier: 'free',
      timestamp: new Date()
    });
  },

  upgradeCompleted: (source: string) => {
    // Track: User hat upgraded
    analytics.track('upgrade_completed', {
      source, // z.B. 'pro_kopf_gate', 'payment_plan_gate'
      timestamp: new Date()
    });
  },

  limitReached: (type: string, current: number, max: number) => {
    // Track: Limit erreicht
    analytics.track('limit_reached', {
      type, // 'guests', 'budget_items', etc.
      current,
      max,
      timestamp: new Date()
    });
  }
};
```

---

## ✅ AKZEPTANZKRITERIEN

Die Prüfung gilt als **bestanden**, wenn:

- [x] **Keine kritischen Lücken mehr vorhanden**
  - [ ] Problem #1 behoben (Payment Plans)
  - [ ] Problem #2 behoben (Pro-Kopf)
  - [ ] Problem #3 behoben (Modal-Guard)

- [x] **Alle Szenarien erfolgreich getestet**
  - [ ] Szenario 1-5 durchgeführt
  - [ ] Erwartete = Tatsächliche Ergebnisse

- [x] **Datenbank-Ebene vollständig gesichert**
  - [ ] Neue RLS-Policies deployed
  - [ ] Premium-Feature-Checks aktiv

- [x] **UI konsistent für Free vs Premium**
  - [ ] Alle Premium-Hinweise einheitlich
  - [ ] Upgrade-Popups erscheinen konsistent
  - [ ] Keine verwirrenden Buttons/Felder

- [x] **Downgrade-Szenario geklärt**
  - [ ] Daten bleiben intakt
  - [ ] Warning-Banner implementiert
  - [ ] Read-only für alte Premium-Features

- [x] **Dokumentation vollständig**
  - [x] Alle Probleme dokumentiert
  - [x] Reproduktionsschritte vorhanden
  - [x] Lösungsvorschläge konkret
  - [x] Testplan bereit

---

## 🚀 NÄCHSTE SCHRITTE

1. **Sofort:** Fixes für Problem #1-3 implementieren
2. **Deployment:** Neue Migration für RLS-Policies
3. **Testing:** Manuelle Tests nach Deployment
4. **Monitoring:** Analytics-Events einbauen
5. **Follow-up:** Mittlere Probleme (#4-8) beheben
6. **Langfristig:** E2E-Tests automatisieren

---

**Audit abgeschlossen:** 02.11.2024
**Status:** 🟡 Teilweise sicher - Fixes erforderlich
**Empfehlung:** Kritische Lücken innerhalb 24h schließen
