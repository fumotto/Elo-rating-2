-- Add SteamID and PSN ID fields to players for external match lookup and identity.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS steam_id TEXT;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS psn_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'players' AND c.conname = 'players_steam_id_unique'
  ) THEN
    ALTER TABLE players ADD CONSTRAINT players_steam_id_unique UNIQUE (steam_id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'players' AND c.conname = 'players_psn_id_unique'
  ) THEN
    ALTER TABLE players ADD CONSTRAINT players_psn_id_unique UNIQUE (psn_id);
  END IF;
END;
$$;
