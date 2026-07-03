
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

  -- If they signed up from an invitation, wire them to the inviting farm
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

  RETURN NEW;
END;
$$;
