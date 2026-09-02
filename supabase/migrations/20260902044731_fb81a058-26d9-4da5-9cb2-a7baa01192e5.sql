ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_by uuid;

UPDATE public.team_invitations SET code = upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)) WHERE code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS team_invitations_code_key ON public.team_invitations (code);