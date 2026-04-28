CREATE TABLE public.sales_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  listing_id UUID,
  buyer_name TEXT NOT NULL,
  buyer_type TEXT NOT NULL DEFAULT 'individual',
  buyer_email TEXT,
  buyer_phone TEXT NOT NULL,
  quantity TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers manage own sales" ON public.sales_records
  FOR ALL TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE TRIGGER update_sales_records_updated_at
  BEFORE UPDATE ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_sales_records_seller ON public.sales_records(seller_id, created_at DESC);