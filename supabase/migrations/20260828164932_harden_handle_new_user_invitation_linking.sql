-- The invitation-linking block added in
-- 20260703220357_3ba8d72a-1b1f-4582-bb11-a21f904cf375.sql runs inside the
-- same transaction as the `auth.users` insert, with no exception handling.
-- Any failure there (a stale/edge-case invitation row, a dangling farm
-- reference, or anything else in that block) rolls back the *entire*
-- signup — which is why an invited worker got "Database error saving new
-- user" from Supabase Auth's admin API and never received an invite email
-- (the row, and the email send that follows a successful row insert,
-- never happened at all).
--
-- This makes the invitation-linking step best-effort: a failure there is
-- caught, logged as a warning (visible in the project's Postgres logs),
-- and the signup still completes normally — the user still gets their
-- profile/role either way. Worst case on a genuine failure, they land on
-- farm-setup instead of being auto-attached to the inviting farm, which
-- the owner can fix manually via Settings → Team Management afterward,
-- rather than the signup failing outright.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _requested_role text;
  _inv_id uuid;
  _inv record;
BEGIN
  -- Always create the profile row
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  -- Read the role the user picked at signup (falls back to 'owner')
  _requested_role := lower(COALESCE(NEW.raw_user_meta_data->>'requested_role', 'owner'));
  IF _requested_role NOT IN ('owner','manager','worker') THEN
    _requested_role := 'owner';
  END IF;

  -- Store their app role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _requested_role::app_role)
  ON CONFLICT DO NOTHING;

  -- If they signed up from an invitation, wire them to the inviting farm.
  -- Best-effort: never let a problem here block the signup itself.
  BEGIN
    _inv_id := NULLIF(NEW.raw_user_meta_data->>'invitation_id', '')::uuid;
    IF _inv_id IS NOT NULL THEN
      SELECT * INTO _inv FROM public.team_invitations
        WHERE id = _inv_id AND status = 'pending' AND expires_at > now();
      IF FOUND THEN
        INSERT INTO public.team_members (farm_id, user_id, role, invited_by, is_active)
        VALUES (_inv.farm_id, NEW.id, _inv.role, _inv.invited_by, true)
        ON CONFLICT DO NOTHING;

        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, _inv.role::app_role)
        ON CONFLICT DO NOTHING;

        UPDATE public.team_invitations
          SET status = 'accepted', accepted_at = now()
          WHERE id = _inv_id;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: invitation linking failed for user %, invitation %: %', NEW.id, _inv_id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
