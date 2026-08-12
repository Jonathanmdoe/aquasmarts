ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS provider_ref text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_note text;

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS mpesa_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS mpesa_account_name text NOT NULL DEFAULT 'AquaSmart';

DROP POLICY IF EXISTS "Super admins can view all payment transactions" ON public.payment_transactions;
CREATE POLICY "Super admins can view all payment transactions"
ON public.payment_transactions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));