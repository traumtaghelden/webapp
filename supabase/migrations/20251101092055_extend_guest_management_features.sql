/*
  # Erweiterte Gästemanagement-Features

  Erweitert die Gästedatenbank mit zusätzlichen Funktionen für professionelles Gästemanagement.

  ## Neue Felder für guests Tabelle
  - age_group: Altersgruppe (adult, child, infant)
  - relationship: Beziehung zum Brautpaar
  - invitation_status: Status der Einladung (not_sent, sent, reminder_sent)
  - invitation_sent_date: Datum des Einladungsversands
  - rsvp_date: Datum der RSVP-Antwort
  - is_vip: VIP-Status
  - special_needs: Besondere Bedürfnisse
  - address: Postadresse für Einladungen
  - city: Stadt
  - postal_code: Postleitzahl
  - country: Land
  - notes: Interne Notizen
  - plus_one_name: Name der Begleitperson
  - gift_received: Geschenk erhalten
  - gift_description: Geschenkbeschreibung
  - checked_in: Check-in Status am Hochzeitstag
  - checked_in_at: Check-in Zeitpunkt

  ## Neue Tabellen
  - guest_communications: Kommunikationshistorie
  - guest_tags: Tags für flexible Organisation

  ## Sicherheit
  - RLS aktiviert für alle neuen Tabellen
  - Policies für authentifizierte Benutzer
*/

-- Erweitere guests Tabelle
ALTER TABLE guests 
  ADD COLUMN IF NOT EXISTS age_group text DEFAULT 'adult' CHECK (age_group IN ('adult', 'child', 'infant')),
  ADD COLUMN IF NOT EXISTS relationship text,
  ADD COLUMN IF NOT EXISTS invitation_status text DEFAULT 'not_sent' CHECK (invitation_status IN ('not_sent', 'save_the_date_sent', 'invitation_sent', 'reminder_sent')),
  ADD COLUMN IF NOT EXISTS invitation_sent_date date,
  ADD COLUMN IF NOT EXISTS rsvp_date date,
  ADD COLUMN IF NOT EXISTS is_vip boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS special_needs text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Deutschland',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS plus_one_name text,
  ADD COLUMN IF NOT EXISTS gift_received boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS gift_description text,
  ADD COLUMN IF NOT EXISTS checked_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamp with time zone;

-- Erstelle guest_communications Tabelle für Kommunikationshistorie
CREATE TABLE IF NOT EXISTS guest_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES guests(id) ON DELETE CASCADE NOT NULL,
  communication_type text NOT NULL CHECK (communication_type IN ('email', 'sms', 'phone', 'letter', 'in_person', 'other')),
  subject text,
  message text,
  sent_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'bounced', 'failed')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Erstelle guest_tags Tabelle
CREATE TABLE IF NOT EXISTS guest_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#d4af37',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(wedding_id, name)
);

-- Erstelle guest_tag_assignments Tabelle
CREATE TABLE IF NOT EXISTS guest_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES guests(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES guest_tags(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(guest_id, tag_id)
);

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_guests_age_group ON guests(age_group);
CREATE INDEX IF NOT EXISTS idx_guests_is_vip ON guests(is_vip);
CREATE INDEX IF NOT EXISTS idx_guests_invitation_status ON guests(invitation_status);
CREATE INDEX IF NOT EXISTS idx_guest_communications_guest_id ON guest_communications(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_tag_assignments_guest_id ON guest_tag_assignments(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_tag_assignments_tag_id ON guest_tag_assignments(tag_id);

-- RLS aktivieren
ALTER TABLE guest_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies für guest_communications
CREATE POLICY "Users can view communications for their wedding guests"
  ON guest_communications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guests
      JOIN weddings ON guests.wedding_id = weddings.id
      WHERE guests.id = guest_communications.guest_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create communications for their wedding guests"
  ON guest_communications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guests
      JOIN weddings ON guests.wedding_id = weddings.id
      WHERE guests.id = guest_communications.guest_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update communications for their wedding guests"
  ON guest_communications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guests
      JOIN weddings ON guests.wedding_id = weddings.id
      WHERE guests.id = guest_communications.guest_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guests
      JOIN weddings ON guests.wedding_id = weddings.id
      WHERE guests.id = guest_communications.guest_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete communications for their wedding guests"
  ON guest_communications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guests
      JOIN weddings ON guests.wedding_id = weddings.id
      WHERE guests.id = guest_communications.guest_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policies für guest_tags
CREATE POLICY "Users can view tags for their wedding"
  ON guest_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guest_tags.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tags for their wedding"
  ON guest_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guest_tags.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tags for their wedding"
  ON guest_tags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guest_tags.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guest_tags.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags for their wedding"
  ON guest_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guest_tags.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- RLS Policies für guest_tag_assignments
CREATE POLICY "Users can view tag assignments for their wedding guests"
  ON guest_tag_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guests
      JOIN weddings ON guests.wedding_id = weddings.id
      WHERE guests.id = guest_tag_assignments.guest_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tag assignments for their wedding guests"
  ON guest_tag_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guests
      JOIN weddings ON guests.wedding_id = weddings.id
      WHERE guests.id = guest_tag_assignments.guest_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tag assignments for their wedding guests"
  ON guest_tag_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guests
      JOIN weddings ON guests.wedding_id = weddings.id
      WHERE guests.id = guest_tag_assignments.guest_id
      AND weddings.user_id = auth.uid()
    )
  );