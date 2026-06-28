-- Add audit table and tighten RLS for match_records

-- 1) Create admin_actions audit table
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Add INSERT policy for match_records to prevent arbitrary client inserts
--    Only authenticated users who are allowed to register matches may insert,
--    and the inserted row must have registered_by either null or equal to auth.uid().
CREATE POLICY "Authenticated can insert match_records when allowed"
  ON match_records FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_register_matches()
    AND (registered_by IS NULL OR registered_by = auth.uid())
  );

-- 3) Enhance RPCs to insert audit records.
-- Recreate register_match with audit insert.

CREATE OR REPLACE FUNCTION public.register_match(
  p_winner_player_ids UUID[],
  p_loser_player_ids UUID[],
  p_external_match_id TEXT DEFAULT NULL,
  p_map_name TEXT DEFAULT NULL,
  p_played_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_k_factor INTEGER;
  v_match_id UUID;
  v_winner_rates INTEGER[];
  v_loser_rates INTEGER[];
  v_winner_avg NUMERIC;
  v_loser_avg NUMERIC;
  v_expected_winner NUMERIC;
  v_expected_loser NUMERIC;
  v_plus_delta INTEGER;
  v_minus_delta INTEGER;
  i INTEGER;
BEGIN
  IF NOT public.can_register_matches() THEN
    RAISE EXCEPTION 'Match registration requires normal_user or admin_user role';
  END IF;

  IF array_length(p_winner_player_ids, 1) <> 3 OR array_length(p_loser_player_ids, 1) <> 3 THEN
    RAISE EXCEPTION 'Exactly 3 winners and 3 losers are required';
  END IF;

  IF (
    SELECT COUNT(DISTINCT unnest_id)
    FROM unnest(p_winner_player_ids || p_loser_player_ids) AS unnest_id
  ) <> 6 THEN
    RAISE EXCEPTION 'Duplicate players are not allowed in a match';
  END IF;

  v_k_factor := public.get_k_factor();

  SELECT ARRAY_AGG(current_rate ORDER BY array_position(p_winner_player_ids, id))
  INTO v_winner_rates
  FROM players
  WHERE id = ANY(p_winner_player_ids);

  SELECT ARRAY_AGG(current_rate ORDER BY array_position(p_loser_player_ids, id))
  INTO v_loser_rates
  FROM players
  WHERE id = ANY(p_loser_player_ids);

  IF v_winner_rates IS NULL OR v_loser_rates IS NULL THEN
    RAISE EXCEPTION 'One or more players were not found';
  END IF;

  v_winner_avg := (v_winner_rates[1] + v_winner_rates[2] + v_winner_rates[3]) / 3.0;
  v_loser_avg := (v_loser_rates[1] + v_loser_rates[2] + v_loser_rates[3]) / 3.0;
  v_expected_winner := 1.0 / (1.0 + POWER(10, (v_loser_avg - v_winner_avg) / 400.0));
  v_expected_loser := 1.0 - v_expected_winner;
  v_plus_delta := ROUND(v_k_factor * (1 - v_expected_winner));
  v_minus_delta := ROUND(v_k_factor * (0 - v_expected_loser));

  INSERT INTO match_records (external_match_id, map_name, played_at, k_factor, registered_by)
  VALUES (p_external_match_id, p_map_name, p_played_at, v_k_factor, auth.uid())
  RETURNING id INTO v_match_id;

  FOR i IN 1..3 LOOP
    INSERT INTO match_participants (
      match_record_id, player_id, team, slot,
      rate_before, rate_after, rate_delta
    ) VALUES (
      v_match_id, p_winner_player_ids[i], 'winner', i,
      v_winner_rates[i], v_winner_rates[i] + v_plus_delta, v_plus_delta
    );

    UPDATE players
    SET current_rate = v_winner_rates[i] + v_plus_delta
    WHERE id = p_winner_player_ids[i];
  END LOOP;

  FOR i IN 1..3 LOOP
    INSERT INTO match_participants (
      match_record_id, player_id, team, slot,
      rate_before, rate_after, rate_delta
    ) VALUES (
      v_match_id, p_loser_player_ids[i], 'loser', i,
      v_loser_rates[i], v_loser_rates[i] + v_minus_delta, v_minus_delta
    );

    UPDATE players
    SET current_rate = v_loser_rates[i] + v_minus_delta
    WHERE id = p_loser_player_ids[i];
  END LOOP;

  -- audit log
  INSERT INTO admin_actions (action, performed_by, details)
  VALUES (
    'register_match',
    auth.uid(),
    jsonb_build_object(
      'match_id', v_match_id,
      'external_match_id', p_external_match_id,
      'winners', p_winner_player_ids,
      'losers', p_loser_player_ids,
      'k_factor', v_k_factor
    )
  );

  RETURN v_match_id;
END;
$$;

-- Recreate rollback_last_match with audit
CREATE OR REPLACE FUNCTION public.rollback_last_match()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_id UUID;
  participant RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  SELECT id INTO v_match_id
  FROM match_records
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF v_match_id IS NULL THEN
    RAISE EXCEPTION 'No match history to rollback';
  END IF;

  FOR participant IN
    SELECT player_id, rate_before
    FROM match_participants
    WHERE match_record_id = v_match_id
  LOOP
    UPDATE players
    SET current_rate = participant.rate_before
    WHERE id = participant.player_id;
  END LOOP;

  DELETE FROM match_records WHERE id = v_match_id;

  -- audit log
  INSERT INTO admin_actions (action, performed_by, details)
  VALUES (
    'rollback_last_match',
    auth.uid(),
    jsonb_build_object('match_id', v_match_id)
  );

  RETURN v_match_id;
END;
$$;

-- Recreate reset_rankings with audit
CREATE OR REPLACE FUNCTION public.reset_rankings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  UPDATE players SET current_rate = initial_rate;
  GET DIAGNOSTICS affected = ROW_COUNT;

  DELETE FROM match_records;

  -- audit log
  INSERT INTO admin_actions (action, performed_by, details)
  VALUES (
    'reset_rankings',
    auth.uid(),
    jsonb_build_object('affected_players', affected)
  );

  RETURN affected;
END;
$$;

-- Recreate set_k_factor with audit
CREATE OR REPLACE FUNCTION public.set_k_factor(p_k_factor INTEGER, p_editable BOOLEAN DEFAULT NULL)
RETURNS app_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result app_settings;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF p_k_factor <= 0 THEN
    RAISE EXCEPTION 'K factor must be positive';
  END IF;

  UPDATE app_settings
  SET value = jsonb_build_object(
    'value', p_k_factor,
    'editable', COALESCE(p_editable, (value ->> 'editable')::BOOLEAN, false)
  )
  WHERE key = 'k_factor'
  RETURNING * INTO result;

  -- audit log
  INSERT INTO admin_actions (action, performed_by, details)
  VALUES (
    'set_k_factor',
    auth.uid(),
    jsonb_build_object('k_factor', p_k_factor, 'editable', COALESCE(p_editable, (result.value ->> 'editable')::BOOLEAN, false))
  );

  RETURN result;
END;
$$;

-- Grant execute remains as before (no change)
GRANT EXECUTE ON FUNCTION public.register_match(UUID[], UUID[], TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_last_match() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_rankings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_k_factor(INTEGER, BOOLEAN) TO authenticated;

-- End of migration
