/*
  # Create Task Templates Table

  1. New Table
    - `task_templates`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `category` (text, for grouping templates)
      - `estimated_days` (integer, estimated duration)
      - `priority` (text, default priority level)
      - `checklist_items` (jsonb, array of checklist items)
      - `is_system` (boolean, whether it's a built-in template)
      - `created_by` (uuid, optional reference to user)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `task_templates` table
    - System templates are visible to all authenticated users
    - Users can create and manage their own custom templates

  3. Indexes
    - Index on category for filtering
    - Index on is_system for quick system template lookup
*/

-- Create task_templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  estimated_days integer,
  priority text DEFAULT 'medium',
  checklist_items jsonb DEFAULT '[]'::jsonb,
  is_system boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
CREATE INDEX IF NOT EXISTS idx_task_templates_is_system ON task_templates(is_system);
CREATE INDEX IF NOT EXISTS idx_task_templates_created_by ON task_templates(created_by);

-- Enable RLS
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view system templates and their own templates
CREATE POLICY "Users can view system and own templates"
ON task_templates FOR SELECT
TO authenticated
USING (
  is_system = true OR created_by = auth.uid()
);

-- Policy: Users can insert their own templates
CREATE POLICY "Users can insert own templates"
ON task_templates FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() AND is_system = false
);

-- Policy: Users can update their own templates (not system templates)
CREATE POLICY "Users can update own templates"
ON task_templates FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() AND is_system = false
)
WITH CHECK (
  created_by = auth.uid() AND is_system = false
);

-- Policy: Users can delete their own templates (not system templates)
CREATE POLICY "Users can delete own templates"
ON task_templates FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() AND is_system = false
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_task_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_task_templates_updated_at();

-- Insert some default system templates
INSERT INTO task_templates (name, description, category, estimated_days, priority, is_system, checklist_items)
VALUES
  (
    'Location auswählen',
    'Hochzeitslocation finden und buchen',
    'Location',
    90,
    'high',
    true,
    '["Budgetrahmen festlegen", "Gästezahl schätzen", "Locations besichtigen", "Verfügbarkeit prüfen", "Vertrag unterschreiben"]'::jsonb
  ),
  (
    'Catering organisieren',
    'Catering-Service für die Hochzeit buchen',
    'Catering',
    60,
    'high',
    true,
    '["Menüoptionen recherchieren", "Verkostungstermin vereinbaren", "Getränke auswählen", "Sonderwünsche besprechen", "Vertrag abschließen"]'::jsonb
  ),
  (
    'Fotograf buchen',
    'Professionellen Hochzeitsfotografen engagieren',
    'Fotografie',
    90,
    'high',
    true,
    '["Portfolio prüfen", "Stil festlegen", "Paket auswählen", "Termin reservieren", "Vertrag unterschreiben"]'::jsonb
  ),
  (
    'Einladungen versenden',
    'Hochzeitseinladungen erstellen und verschicken',
    'Einladungen',
    45,
    'medium',
    true,
    '["Design auswählen", "Text formulieren", "Druckerei beauftragen", "Adressen sammeln", "Einladungen versenden"]'::jsonb
  ),
  (
    'Blumendekoration planen',
    'Blumenschmuck für Zeremonie und Feier organisieren',
    'Dekoration',
    30,
    'medium',
    true,
    '["Farbschema festlegen", "Blumenarten wählen", "Florist konsultieren", "Brautstrauß auswählen", "Tischdekoration planen"]'::jsonb
  ),
  (
    'Musik buchen',
    'DJ oder Band für die Hochzeitsfeier engagieren',
    'Unterhaltung',
    60,
    'medium',
    true,
    '["Musikstil festlegen", "Angebote einholen", "Probeaufnahmen anhören", "Songwünsche zusammenstellen", "Vertrag abschließen"]'::jsonb
  )
ON CONFLICT DO NOTHING;