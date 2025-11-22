/*
  # Fix get_all_feedback_admin - Behebe mehrdeutige Spaltenreferenz

  ## Problem
  Die Funktion get_all_feedback_admin hat eine mehrdeutige "id" Spaltenreferenz.
  Sowohl user_feedback als auch user_profiles haben eine id-Spalte.

  ## Änderungen
  - Explizite Tabellenpräfixe für alle Spaltenreferenzen in der Funktion
  - uf.id, up.id statt nur id
*/

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
  WHERE user_profiles.id = v_user_id;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Return filtered feedback with total count
  RETURN QUERY
  WITH filtered_feedback AS (
    SELECT
      uf.id AS feedback_id,
      up.email AS user_email,
      uf.feedback_text,
      uf.satisfaction_rating,
      uf.allow_public_use,
      uf.admin_hidden,
      uf.created_at
    FROM user_feedback uf
    JOIN user_profiles up ON up.id = uf.user_id
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
    ff.feedback_id,
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
