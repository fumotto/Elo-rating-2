-- Roles and core tables for 3v3 Elo rating manager

CREATE TYPE user_role AS ENUM ('admin_user', 'normal_user', 'guest_user');
CREATE TYPE match_team AS ENUM ('winner', 'loser');

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_id TEXT,
  display_name TEXT,
  role user_role NOT NULL DEFAULT 'guest_user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  initial_rate INTEGER NOT NULL DEFAULT 1500 CHECK (initial_rate >= 0),
  current_rate INTEGER NOT NULL DEFAULT 1500 CHECK (current_rate >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT players_name_unique UNIQUE (name)
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
  ('k_factor', '{"value": 32, "editable": false}'::jsonb);

CREATE TABLE match_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_match_id TEXT,
  map_name TEXT,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  k_factor INTEGER NOT NULL CHECK (k_factor > 0),
  registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_record_id UUID NOT NULL REFERENCES match_records(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  team match_team NOT NULL,
  slot SMALLINT NOT NULL CHECK (slot BETWEEN 1 AND 3),
  rate_before INTEGER NOT NULL,
  rate_after INTEGER NOT NULL,
  rate_delta INTEGER NOT NULL,
  CONSTRAINT match_participants_unique_slot UNIQUE (match_record_id, team, slot),
  CONSTRAINT match_participants_unique_player UNIQUE (match_record_id, player_id)
);

CREATE INDEX idx_match_records_created_at ON match_records(created_at DESC);
CREATE INDEX idx_match_participants_match_record_id ON match_participants(match_record_id);
CREATE INDEX idx_players_current_rate ON players(current_rate DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, discord_id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'provider_id', NEW.raw_user_meta_data ->> 'sub'),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NEW.email),
    'guest_user'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM user_profiles WHERE id = auth.uid()),
    'guest_user'::user_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() = 'admin_user'::user_role;
$$;

CREATE OR REPLACE FUNCTION public.can_register_matches()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('admin_user'::user_role, 'normal_user'::user_role);
$$;

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile display name"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update any profile role"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Players are viewable by everyone"
  ON players FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert players"
  ON players FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update players"
  ON players FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete players"
  ON players FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Settings are viewable by everyone"
  ON app_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Match records are viewable by everyone"
  ON match_records FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Match participants are viewable by everyone"
  ON match_participants FOR SELECT
  TO anon, authenticated
  USING (true);
