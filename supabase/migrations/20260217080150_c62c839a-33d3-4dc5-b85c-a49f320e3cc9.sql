
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Farms table
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Farm',
  operation_type TEXT NOT NULL DEFAULT 'grow_out',
  production_system TEXT NOT NULL DEFAULT 'ponds',
  market_orientation TEXT NOT NULL DEFAULT 'table_fish',
  num_ponds INTEGER DEFAULT 0,
  location TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- Fish batches
CREATE TABLE public.fish_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'fingerling',
  pond TEXT,
  stock_date DATE NOT NULL DEFAULT CURRENT_DATE,
  initial_count INTEGER NOT NULL DEFAULT 0,
  current_count INTEGER NOT NULL DEFAULT 0,
  avg_weight NUMERIC DEFAULT 0,
  biomass NUMERIC DEFAULT 0,
  fcr NUMERIC DEFAULT 0,
  mortality_rate NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'stocked',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fish_batches ENABLE ROW LEVEL SECURITY;

-- Feeding logs
CREATE TABLE public.feeding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.fish_batches(id) ON DELETE CASCADE,
  feed_type TEXT NOT NULL,
  amount_kg NUMERIC NOT NULL,
  feeding_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.feeding_logs ENABLE ROW LEVEL SECURITY;

-- Water quality readings
CREATE TABLE public.water_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.fish_batches(id) ON DELETE CASCADE,
  temperature NUMERIC,
  ph NUMERIC,
  dissolved_oxygen NUMERIC,
  ammonia NUMERIC,
  nitrite NUMERIC,
  salinity NUMERIC,
  turbidity NUMERIC,
  reading_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.water_readings ENABLE ROW LEVEL SECURITY;

-- Health records
CREATE TABLE public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.fish_batches(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL DEFAULT 'observation',
  title TEXT NOT NULL,
  description TEXT,
  mortality_count INTEGER DEFAULT 0,
  treatment TEXT,
  severity TEXT DEFAULT 'low',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

-- Biosecurity checklists
CREATE TABLE public.biosecurity_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.biosecurity_checks ENABLE ROW LEVEL SECURITY;

-- Financial records
CREATE TABLE public.financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.fish_batches(id) ON DELETE SET NULL,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL DEFAULT 'expense',
  category TEXT NOT NULL DEFAULT 'feed',
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_farm_owner(_farm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farms WHERE id = _farm_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_batch_farm_owner(_batch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fish_batches b
    JOIN public.farms f ON f.id = b.farm_id
    WHERE b.id = _batch_id AND f.user_id = auth.uid()
  );
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.fish_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS POLICIES

-- Profiles
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Farms
CREATE POLICY "Users manage own farms" ON public.farms FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fish batches
CREATE POLICY "Farm owners manage batches" ON public.fish_batches FOR ALL
  USING (public.is_farm_owner(farm_id)) WITH CHECK (public.is_farm_owner(farm_id));

-- Feeding logs
CREATE POLICY "Batch owners manage feeding" ON public.feeding_logs FOR ALL
  USING (public.is_batch_farm_owner(batch_id)) WITH CHECK (public.is_batch_farm_owner(batch_id));

-- Water readings
CREATE POLICY "Batch owners manage water" ON public.water_readings FOR ALL
  USING (public.is_batch_farm_owner(batch_id)) WITH CHECK (public.is_batch_farm_owner(batch_id));

-- Health records
CREATE POLICY "Batch owners manage health" ON public.health_records FOR ALL
  USING (public.is_batch_farm_owner(batch_id)) WITH CHECK (public.is_batch_farm_owner(batch_id));

-- Biosecurity checks
CREATE POLICY "Farm owners manage biosecurity" ON public.biosecurity_checks FOR ALL
  USING (public.is_farm_owner(farm_id)) WITH CHECK (public.is_farm_owner(farm_id));

-- Financial records
CREATE POLICY "Farm owners manage financials" ON public.financial_records FOR ALL
  USING (public.is_farm_owner(farm_id)) WITH CHECK (public.is_farm_owner(farm_id));
