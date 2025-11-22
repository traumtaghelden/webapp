/*
  # Advanced Budget System mit Pro-Kopf-Kosten, Zahlungsplänen und Recurring Costs

  ## 1. Neue Tabellen
    - `recurring_budget_items`
      - Wiederkehrende Kosten (monatlich/jährlich)
      - Automatische Generierung von Budget-Items
    - `payment_plan_templates`
      - Vordefinierte Zahlungsplan-Vorlagen

  ## 2. Erweiterungen zu budget_items
    - `is_per_person` - Flag für Pro-Kopf-Kalkulation
    - `cost_per_person` - Kosten pro Gast
    - `use_confirmed_guests_only` - Nutze nur bestätigte Gäste
    - `guest_count_override` - Manuelle Gästeanzahl-Überschreibung
    - `timeline_event_id` - Zuordnung zu Timeline-Event (Referenz: wedding_timeline)
    - Automatische Berechnung von estimated_cost und actual_cost

  ## 3. Erweiterungen zu budget_payments
    - `payment_type` - Art der Zahlung (deposit, milestone, final, monthly)
    - `percentage_of_total` - Prozentanteil vom Gesamtbetrag
    - `trigger_date_type` - Trigger für Zahlung (contract, before_wedding, after_wedding)
    - `days_offset` - Tage vor/nach Trigger-Datum

  ## 4. Neue Views und Functions
    - `get_confirmed_guests_count()` - Zählt bestätigte Gäste
    - `calculate_per_person_total()` - Berechnet Summe aller Pro-Kopf-Kosten
    - `get_monthly_payments()` - Zeigt fällige Zahlungen pro Monat

  ## 5. Security
    - RLS für alle neuen Tabellen
    - Policies für authenticated users basierend auf wedding_id
*/

-- Add new columns to budget_items
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS is_per_person boolean DEFAULT false;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS cost_per_person decimal(10,2);
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS use_confirmed_guests_only boolean DEFAULT false;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS guest_count_override integer;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS timeline_event_id uuid REFERENCES wedding_timeline(id) ON DELETE SET NULL;

-- Add new columns to budget_payments
ALTER TABLE budget_payments ADD COLUMN IF NOT EXISTS payment_type text CHECK (payment_type IN ('deposit', 'milestone', 'final', 'monthly')) DEFAULT 'final';
ALTER TABLE budget_payments ADD COLUMN IF NOT EXISTS percentage_of_total decimal(5,2);
ALTER TABLE budget_payments ADD COLUMN IF NOT EXISTS trigger_date_type text CHECK (trigger_date_type IN ('contract', 'before_wedding', 'after_wedding', 'fixed')) DEFAULT 'fixed';
ALTER TABLE budget_payments ADD COLUMN IF NOT EXISTS days_offset integer DEFAULT 0;

-- Create recurring_budget_items table
CREATE TABLE IF NOT EXISTS recurring_budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  base_budget_item_id uuid REFERENCES budget_items(id) ON DELETE CASCADE NOT NULL,
  recurrence_pattern text CHECK (recurrence_pattern IN ('monthly', 'yearly')) NOT NULL,
  interval_count integer DEFAULT 1 NOT NULL,
  start_date date NOT NULL,
  end_date date,
  last_generated_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recurring_budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recurring budget items for their weddings"
  ON recurring_budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = recurring_budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert recurring budget items for their weddings"
  ON recurring_budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = recurring_budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recurring budget items for their weddings"
  ON recurring_budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = recurring_budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = recurring_budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete recurring budget items for their weddings"
  ON recurring_budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = recurring_budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Create payment_plan_templates table
CREATE TABLE IF NOT EXISTS payment_plan_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  payment_schedule jsonb NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_plan_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view payment plan templates"
  ON payment_plan_templates FOR SELECT
  TO authenticated
  USING (true);

-- Insert default payment plan templates
INSERT INTO payment_plan_templates (name, description, payment_schedule, is_default) VALUES
  ('Standard 30/70', '30% Anzahlung, 70% Restbetrag', '[{"type": "deposit", "percentage": 30, "trigger": "contract", "days_offset": 0}, {"type": "final", "percentage": 70, "trigger": "after_wedding", "days_offset": 7}]', true),
  ('Drei Raten 20/40/40', '20% Anzahlung, 40% einen Monat vorher, 40% nach Hochzeit', '[{"type": "deposit", "percentage": 20, "trigger": "contract", "days_offset": 0}, {"type": "milestone", "percentage": 40, "trigger": "before_wedding", "days_offset": 30}, {"type": "final", "percentage": 40, "trigger": "after_wedding", "days_offset": 7}]', false),
  ('Anzahlung 50/50', '50% Anzahlung, 50% Restbetrag', '[{"type": "deposit", "percentage": 50, "trigger": "contract", "days_offset": 0}, {"type": "final", "percentage": 50, "trigger": "after_wedding", "days_offset": 7}]', false)
ON CONFLICT DO NOTHING;

-- Function to get confirmed guests count
CREATE OR REPLACE FUNCTION get_confirmed_guests_count(p_wedding_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM guests
  WHERE wedding_id = p_wedding_id
  AND rsvp_status = 'accepted';
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function to calculate per person costs
CREATE OR REPLACE FUNCTION calculate_per_person_total(p_wedding_id uuid, p_guest_count integer)
RETURNS decimal
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total decimal;
BEGIN
  SELECT COALESCE(SUM(cost_per_person * p_guest_count), 0)
  INTO v_total
  FROM budget_items
  WHERE wedding_id = p_wedding_id
  AND is_per_person = true;
  
  RETURN v_total;
END;
$$;

-- Function to get monthly payments due
CREATE OR REPLACE FUNCTION get_monthly_payments(p_wedding_id uuid, p_year integer, p_month integer)
RETURNS TABLE (
  payment_id uuid,
  budget_item_id uuid,
  item_name text,
  vendor_name text,
  amount decimal,
  due_date date,
  status text,
  payment_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.id,
    bp.budget_item_id,
    bi.item_name,
    v.name,
    bp.amount,
    bp.due_date,
    bp.status,
    bp.payment_type
  FROM budget_payments bp
  JOIN budget_items bi ON bi.id = bp.budget_item_id
  LEFT JOIN vendors v ON v.id = bi.vendor_id
  WHERE bi.wedding_id = p_wedding_id
  AND EXTRACT(YEAR FROM bp.due_date) = p_year
  AND EXTRACT(MONTH FROM bp.due_date) = p_month
  ORDER BY bp.due_date ASC;
END;
$$;

-- Trigger to automatically calculate budget item costs based on per-person settings
CREATE OR REPLACE FUNCTION update_budget_item_costs()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_wedding_id uuid;
  v_planned_guests integer;
  v_confirmed_guests integer;
  v_guest_count integer;
BEGIN
  -- Get wedding_id and guest counts
  v_wedding_id := NEW.wedding_id;
  
  SELECT guest_count INTO v_planned_guests
  FROM weddings
  WHERE id = v_wedding_id;
  
  v_confirmed_guests := get_confirmed_guests_count(v_wedding_id);
  
  -- Only update if this is a per-person item
  IF NEW.is_per_person = true THEN
    -- Use override if set, otherwise use appropriate guest count
    IF NEW.guest_count_override IS NOT NULL THEN
      v_guest_count := NEW.guest_count_override;
    ELSIF NEW.use_confirmed_guests_only = true THEN
      v_guest_count := v_confirmed_guests;
    ELSE
      v_guest_count := v_planned_guests;
    END IF;
    
    -- Calculate estimated and actual costs
    NEW.estimated_cost := NEW.cost_per_person * v_planned_guests;
    NEW.actual_cost := NEW.cost_per_person * v_guest_count;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_budget_item_costs ON budget_items;
CREATE TRIGGER trigger_update_budget_item_costs
  BEFORE INSERT OR UPDATE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_item_costs();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_items_per_person ON budget_items(wedding_id, is_per_person) WHERE is_per_person = true;
CREATE INDEX IF NOT EXISTS idx_budget_items_timeline ON budget_items(timeline_event_id) WHERE timeline_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_budget_payments_due_date ON budget_payments(due_date) WHERE status != 'paid';
CREATE INDEX IF NOT EXISTS idx_recurring_budget_items_active ON recurring_budget_items(wedding_id, is_active) WHERE is_active = true;