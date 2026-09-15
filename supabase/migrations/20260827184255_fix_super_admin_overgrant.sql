-- Corrects 20260610082314_0f11a20f-3d33d.../"Auto-promote first farm owner to
-- super_admin" seed migration, which had no LIMIT/ORDER BY and therefore
-- granted super_admin to every distinct user_id in public.farms (i.e. every
-- farm owner, not just one intended seed admin).
--
-- This migration revokes the accidental grants and leaves super_admin only
-- on the account confirmed as the intended platform admin.

DELETE FROM public.user_roles
WHERE role = 'super_admin'::public.app_role
  AND user_id NOT IN (
    SELECT id FROM auth.users WHERE email = 'jonathanmdoe3@gmail.com'
  );

-- Idempotent: ensure the intended admin actually holds the role even if
-- their farms.user_id row somehow wasn't part of the original bad grant.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role
FROM auth.users
WHERE email = 'jonathanmdoe3@gmail.com'
ON CONFLICT DO NOTHING;
