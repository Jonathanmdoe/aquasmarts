CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  purpose text NOT NULL,
  plan text,
  reference text NOT NULL UNIQUE,
  related_id uuid,
  amount_tzs bigint NOT NULL,
  phone text,
  channel text NOT NULL DEFAULT 'mobile_money',
  provider text NOT NULL DEFAULT 'selcom',
  selcom_transid text,
  payment_url text,
  status text NOT NULL DEFAULT 'pending',
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own payments"
ON public.payment_transactions FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins view all payments"
ON public.payment_transactions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_payment_transactions_updated
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_payment_transactions_user ON public.payment_transactions(user_id);