ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS mpesa_auto_approve boolean NOT NULL DEFAULT true;