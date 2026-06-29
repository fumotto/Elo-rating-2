-- RPC functions for match registration, rollback, and rank reset

CREATE OR REPLACE FUNCTION public.get_k_factor()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((value ->> 'value')::INTEGER, 32)
  FROM app_settings
  WHERE key = 'k_factor';
$$;

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

  RETURN result;
END;
$$;

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

  RETURN v_match_id;
END;
$$;

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

  RETURN v_match_id;
END;
$$;

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

  RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ranking()
RETURNS TABLE (
  rank INTEGER,
  player_id UUID,
  player_name TEXT,
  initial_rate INTEGER,
  current_rate INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ordered AS (
    SELECT
      id,
      name,
      initial_rate,
      current_rate,
      ROW_NUMBER() OVER (ORDER BY current_rate DESC, name ASC) AS row_num,
      DENSE_RANK() OVER (ORDER BY current_rate DESC) AS dense_rank
    FROM players
  )
  SELECT dense_rank::INTEGER, id, name, initial_rate, current_rate
  FROM ordered
  ORDER BY row_num;
$$;

CREATE OR REPLACE FUNCTION public.get_match_history(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  match_id UUID,
  external_match_id TEXT,
  map_name TEXT,
  played_at TIMESTAMPTZ,
  k_factor INTEGER,
  registered_by UUID,
  participants JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    mr.id,
    mr.external_match_id,
    mr.map_name,
    mr.played_at,
    mr.k_factor,
    mr.registered_by,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'player_id', mp.player_id,
          'player_name', p.name,
          'team', mp.team,
          'slot', mp.slot,
          'rate_before', mp.rate_before,
          'rate_after', mp.rate_after,
          'rate_delta', mp.rate_delta
        )
        ORDER BY mp.team DESC, mp.slot
      ) FILTER (WHERE mp.id IS NOT NULL),
      '[]'::jsonb
    ) AS participants
  FROM match_records mr
  LEFT JOIN match_participants mp ON mp.match_record_id = mr.id
  LEFT JOIN players p ON p.id = mp.player_id
  GROUP BY mr.id
  ORDER BY mr.created_at DESC
  LIMIT GREATEST(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_k_factor() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_k_factor(INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_match(UUID[], UUID[], TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_last_match() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_rankings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ranking() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_match_history(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_register_matches() TO authenticated;
