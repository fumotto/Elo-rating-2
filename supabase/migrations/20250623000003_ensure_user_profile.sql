-- Ensure a user_profiles row exists for the current authenticated user.

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u RECORD;
  created user_profiles%ROWTYPE;
BEGIN
  SELECT * INTO u FROM auth.users WHERE id = auth.uid();
  IF u IS NULL THEN
    RAISE EXCEPTION 'No authenticated user';
  END IF;

  INSERT INTO public.user_profiles (id, discord_id, display_name, role)
  VALUES (
    u.id,
    COALESCE(
      u.raw_user_meta_data ->> 'provider_user_id',
      u.raw_user_meta_data ->> 'provider_id',
      u.raw_user_meta_data ->> 'sub'
    ),
    COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', u.email),
    'guest_user'
  )
  ON CONFLICT (id) DO UPDATE
    SET discord_id = COALESCE(user_profiles.discord_id, EXCLUDED.discord_id),
        display_name = COALESCE(user_profiles.display_name, EXCLUDED.display_name)
  RETURNING * INTO created;

  RETURN created;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;
