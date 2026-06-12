
-- INVOICES
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES public.fish_batches(id) ON DELETE SET NULL,
  buyer_name text NOT NULL,
  buyer_contact text,
  item text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('draft','pending','paid','overdue','cancelled')),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  paid_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farm owner manages invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_farm_owner(farm_id) OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.is_farm_owner(farm_id) OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- LOANS
CREATE TABLE public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  lender text NOT NULL,
  purpose text,
  principal numeric NOT NULL CHECK (principal > 0),
  interest_rate numeric NOT NULL DEFAULT 0,
  monthly_installment numeric NOT NULL CHECK (monthly_installment >= 0),
  term_months integer NOT NULL CHECK (term_months > 0),
  remaining_balance numeric NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','defaulted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO authenticated;
GRANT ALL ON public.loans TO service_role;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farm owner manages loans" ON public.loans
  FOR ALL TO authenticated
  USING (public.is_farm_owner(farm_id) OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.is_farm_owner(farm_id) OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER loans_updated BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- LOAN PAYMENTS
CREATE TABLE public.loan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loan_payments TO authenticated;
GRANT ALL ON public.loan_payments TO service_role;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farm owner manages loan payments" ON public.loan_payments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.loans l WHERE l.id = loan_id AND (public.is_farm_owner(l.farm_id) OR public.has_role(auth.uid(),'super_admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.loans l WHERE l.id = loan_id AND (public.is_farm_owner(l.farm_id) OR public.has_role(auth.uid(),'super_admin'))));
