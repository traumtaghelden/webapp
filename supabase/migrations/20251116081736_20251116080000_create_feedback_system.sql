/*
  # Internes Feedback-System

  ## Übersicht
  Erstellt ein vollständig unabhängiges Feedback-System für Benutzer-Feedback mit automatischer
  Testphasen-Verlängerung um 3 Tage für aktive Testphasen-Benutzer.

  ## Änderungen

  ### 1. Neue Tabelle
  - user_feedback: Speichert Benutzer-Feedback mit folgenden Feldern:
    - id (uuid, primary key)
    - user_id (uuid, references user_profiles, unique constraint)
    - feedback_text (text, required, min 10 Zeichen)
    - satisfaction_rating (integer, nullable, 1-5)
    - allow_public_use (boolean, required)
    - admin_hidden (boolean, default false)
    - created_at (timestamptz)

  ### 2. Neue Funktionen
  - submit_user_feedback(): Benutzer reicht Feedback ein, Testphase wird bei aktiven Trials verlängert
  - get_all_feedback_admin(): Admin-RPC zum Abrufen aller Feedbacks mit Filteroptionen
  - toggle_feedback_visibility(): Admin-Toggle zum Ein-/Ausblenden einzelner Feedbacks

  ### 3. RLS-Richtlinien
  - Benutzer können nur eigenes Feedback sehen und einreichen (1x Limit)
  - Admins können alle Feedbacks sehen und verwalten

  ### 4. Audit-Trail
  - Testphasen-Verlängerungen werden in subscription_events geloggt

  ## Sicherheit
  - RLS aktiviert auf allen Tabellen
  - UNIQUE Constraint verhindert mehrfaches Feedback pro Benutzer
  - Alle Funktionen mit SECURITY DEFINER und search_path = public
*/

-- =====================================================
-- PHASE 1: CREATE FEEDBACK TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feedback_text text NOT NULL CHECK (char_length(feedback_text) >= 10),
  satisfaction_rating integer CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  allow_public_use boolean NOT NULL DEFAULT false,
  admin_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- UNIQUE constraint: Ein Feedback pro Benutzer
ALTER TABLE user_feedback ADD CONSTRAINT unique_user_feedback UNIQUE (user_id);

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_allow_public ON user_feedback(allow_public_use) WHERE allow_public_use = true;
CREATE INDEX IF NOT EXISTS idx_user_feedback_admin_visible ON user_feedback(admin_hidden) WHERE admin_hidden = false;

-- Enable RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PHASE 2: RLS POLICIES
-- =====================================================

-- Benutzer können nur eigenes Feedback sehen
CREATE POLICY "Users can view own feedback"
  ON user_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Benutzer können Feedback einreichen (wird über RPC gesteuert für bessere Validierung)
CREATE POLICY "Users can insert own feedback via RPC"
  ON user_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins können alle Feedbacks sehen
CREATE POLICY "Admins can view all feedback"
  ON user_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_role = 'admin'
    )
  );

-- Admins können admin_hidden togglen
CREATE POLICY "Admins can update feedback visibility"
  ON user_feedback FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_role = 'admin'
    )
  );

-- =====================================================
-- PHASE 3: FEEDBACK SUBMISSION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION submit_user_feedback(
  p_feedback_text text,
  p_satisfaction_rating integer,
  p_allow_public_use boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_account_status account_status_type;
  v_trial_ends_at timestamptz;
  v_new_trial_ends_at timestamptz;
  v_feedback_id uuid;
  v_trial_extended boolean := false;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- Validate feedback text length
  IF char_length(p_feedback_text) < 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Feedback muss mindestens 10 Zeichen lang sein'
    );
  END IF;

  -- Validate satisfaction rating if provided
  IF p_satisfaction_rating IS NOT NULL AND (p_satisfaction_rating < 1 OR p_satisfaction_rating > 5) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Zufriedenheitsbewertung muss zwischen 1 und 5 liegen'
    );
  END IF;

  -- Check if user already submitted feedback
  IF EXISTS (SELECT 1 FROM user_feedback WHERE user_id = v_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Du hast bereits Feedback eingereicht'
    );
  END IF;

  -- Insert feedback
  INSERT INTO user_feedback (user_id, feedback_text, satisfaction_rating, allow_public_use)
  VALUES (v_user_id, p_feedback_text, p_satisfaction_rating, p_allow_public_use)
  RETURNING id INTO v_feedback_id;

  -- Get current account status and trial info
  SELECT account_status, trial_ends_at
  INTO v_account_status, v_trial_ends_at
  FROM user_profiles
  WHERE user_id = v_user_id;

  -- Extend trial if user has active trial
  IF v_account_status = 'trial_active' AND v_trial_ends_at IS NOT NULL THEN
    v_new_trial_ends_at := v_trial_ends_at + INTERVAL '3 days';

    -- Update trial end date
    UPDATE user_profiles
    SET trial_ends_at = v_new_trial_ends_at
    WHERE user_id = v_user_id;

    -- Log in subscription_events
    INSERT INTO subscription_events (user_id, event_type, old_status, new_status, source, metadata)
    VALUES (
      v_user_id,
      'trial_extended_feedback',
      v_account_status::text,
      v_account_status::text,
      'feedback',
      jsonb_build_object(
        'feedback_id', v_feedback_id,
        'days_added', 3,
        'old_trial_ends_at', v_trial_ends_at,
        'new_trial_ends_at', v_new_trial_ends_at
      )
    );

    v_trial_extended := true;
  END IF;

  -- Return success with trial extension info
  RETURN jsonb_build_object(
    'success', true,
    'feedback_id', v_feedback_id,
    'trial_extended', v_trial_extended,
    'new_trial_ends_at', v_new_trial_ends_at,
    'message', CASE
      WHEN v_trial_extended THEN 'Vielen Dank für dein Feedback! Deine Testphase wurde um 3 Tage verlängert.'
      ELSE 'Vielen Dank für dein Feedback!'
    END
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Du hast bereits Feedback eingereicht'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ein Fehler ist aufgetreten: ' || SQLERRM
    );
END;
$$;

-- =====================================================
-- PHASE 4: ADMIN FEEDBACK RETRIEVAL FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_all_feedback_admin(
  p_only_public boolean DEFAULT false,
  p_search_text text DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_email text,
  feedback_text text,
  satisfaction_rating integer,
  allow_public_use boolean,
  admin_hidden boolean,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user is admin
  SELECT (user_role = 'admin') INTO v_is_admin
  FROM user_profiles
  WHERE id = v_user_id;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Return filtered feedback with total count
  RETURN QUERY
  WITH filtered_feedback AS (
    SELECT
      uf.id,
      up.email as user_email,
      uf.feedback_text,
      uf.satisfaction_rating,
      uf.allow_public_use,
      uf.admin_hidden,
      uf.created_at
    FROM user_feedback uf
    JOIN user_profiles up ON up.user_id = uf.user_id
    WHERE
      (NOT p_only_public OR uf.allow_public_use = true)
      AND (p_search_text IS NULL OR
           uf.feedback_text ILIKE '%' || p_search_text || '%' OR
           up.email ILIKE '%' || p_search_text || '%')
    ORDER BY uf.created_at DESC
  ),
  total AS (
    SELECT COUNT(*) as cnt FROM filtered_feedback
  )
  SELECT
    ff.id,
    ff.user_email,
    ff.feedback_text,
    ff.satisfaction_rating,
    ff.allow_public_use,
    ff.admin_hidden,
    ff.created_at,
    t.cnt as total_count
  FROM filtered_feedback ff
  CROSS JOIN total t
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =====================================================
-- PHASE 5: ADMIN TOGGLE VISIBILITY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION toggle_feedback_visibility(p_feedback_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
  v_new_hidden_status boolean;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- Check if user is admin
  SELECT (user_role = 'admin') INTO v_is_admin
  FROM user_profiles
  WHERE id = v_user_id;

  IF NOT COALESCE(v_is_admin, false) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Admin access required'
    );
  END IF;

  -- Toggle admin_hidden status
  UPDATE user_feedback
  SET admin_hidden = NOT admin_hidden
  WHERE id = p_feedback_id
  RETURNING admin_hidden INTO v_new_hidden_status;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Feedback nicht gefunden'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'admin_hidden', v_new_hidden_status
  );
END;
$$;

-- =====================================================
-- PHASE 6: HELPER FUNCTION - CHECK IF USER HAS SUBMITTED FEEDBACK
-- =====================================================

CREATE OR REPLACE FUNCTION has_submitted_feedback()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (SELECT 1 FROM user_feedback WHERE user_id = v_user_id);
END;
$$;

-- =====================================================
-- PHASE 7: ANALYZE TABLE
-- =====================================================

ANALYZE user_feedback;

-- =====================================================
-- PHASE 8: VALIDATION
-- =====================================================

-- Verify table exists
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_feedback') = 1,
    'user_feedback table not found';
END $$;

-- Verify functions exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'submit_user_feedback') = 1,
    'submit_user_feedback function not found';
  ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_all_feedback_admin') = 1,
    'get_all_feedback_admin function not found';
  ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'toggle_feedback_visibility') = 1,
    'toggle_feedback_visibility function not found';
  ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname = 'has_submitted_feedback') = 1,
    'has_submitted_feedback function not found';
END $$;
