
-- Create marketplace_listings table
CREATE TABLE public.marketplace_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  species text NOT NULL,
  price numeric NOT NULL,
  unit text NOT NULL,
  quantity text NOT NULL,
  weight text,
  location text NOT NULL,
  description text,
  survival_guarantee numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active listings
CREATE POLICY "Anyone can read active listings"
  ON public.marketplace_listings FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Users manage own listings
CREATE POLICY "Users manage own listings"
  ON public.marketplace_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own listings"
  ON public.marketplace_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own listings"
  ON public.marketplace_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
