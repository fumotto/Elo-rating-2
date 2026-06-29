-- Add a safe delete RPC for players that checks references before deleting

CREATE OR REPLACE FUNCTION public.delete_player_safe(p_player_id uuid, p_force boolean DEFAULT false)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  participant_count integer;
BEGIN
  SELECT count(*) INTO participant_count FROM match_participants WHERE player_id = p_player_id;
  IF participant_count > 0 AND NOT p_force THEN
    RAISE EXCEPTION 'Player is referenced by % match_participant(s); aborting delete. Use p_force = true to force.', participant_count;
  END IF;

  IF participant_count > 0 AND p_force THEN
    DELETE FROM match_participants WHERE player_id = p_player_id;
    -- Note: we intentionally DO NOT delete match_records; removing participants may leave records incomplete.
  END IF;

  DELETE FROM players WHERE id = p_player_id;

  RETURN 'deleted';
END;
$$;

COMMENT ON FUNCTION public.delete_player_safe(uuid, boolean) IS 'Safely delete a player after checking references. If p_force true, deletes participant rows first.';
