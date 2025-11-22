/*
  # Fix Feedback Function - Korrekte user_id Referenz

  ## Problem
  Die Funktion submit_user_feedback verwendet falsche Spaltenreferenz für user_profiles.
  In user_profiles heißt die Spalte `id`, nicht `user_id`.

  ## Änderungen
  - Korrigiere WHERE-Clauses von `user_id = v_user_id` zu `id = v_user_id`
  - Betrifft: submit_user_feedback Funktion
*/

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

  -- Get current account status and trial info (FIXED: id statt user_id)
  SELECT account_status, trial_ends_at
  INTO v_account_status, v_trial_ends_at
  FROM user_profiles
  WHERE id = v_user_id;

  -- Extend trial if user has active trial
  IF v_account_status = 'trial_active' AND v_trial_ends_at IS NOT NULL THEN
    v_new_trial_ends_at := v_trial_ends_at + INTERVAL '3 days';

    -- Update trial end date (FIXED: id statt user_id)
    UPDATE user_profiles
    SET trial_ends_at = v_new_trial_ends_at
    WHERE id = v_user_id;

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
