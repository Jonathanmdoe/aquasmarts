-- ============ HATCHERY PONDS ============
CREATE TABLE public.hatchery_ponds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity integer,
  purpose text NOT NULL DEFAULT 'nursery',
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX hatchery_ponds_farm_name_key ON public.hatchery_ponds (farm_id, upper(name));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hatchery_ponds TO authenticated;
GRANT ALL ON public.hatchery_ponds TO service_role;
ALTER TABLE public.hatchery_ponds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farm members read hatchery ponds" ON public.hatchery_ponds FOR SELECT TO authenticated USING (public.is_farm_member(farm_id));
CREATE POLICY "Farm members insert hatchery ponds" ON public.hatchery_ponds FOR INSERT TO authenticated WITH CHECK (public.is_farm_member(farm_id));
CREATE POLICY "Farm members update hatchery ponds" ON public.hatchery_ponds FOR UPDATE TO authenticated USING (public.is_farm_member(farm_id)) WITH CHECK (public.is_farm_member(farm_id));
CREATE POLICY "Farm owners delete hatchery ponds" ON public.hatchery_ponds FOR DELETE TO authenticated USING (public.is_farm_owner(farm_id));

CREATE TRIGGER trg_hatchery_ponds_updated BEFORE UPDATE ON public.hatchery_ponds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ BROODERS ============
CREATE TABLE public.brooders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  brooder_code text NOT NULL,
  species text NOT NULL DEFAULT 'Nile Tilapia',
  quantity integer NOT NULL DEFAULT 0,
  male_count integer,
  female_count integer,
  stocking_date date NOT NULL DEFAULT CURRENT_DATE,
  pond_name text NOT NULL,
  avg_weight_g numeric NOT NULL DEFAULT 0,
  health_status text NOT NULL DEFAULT 'active',
  staff text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX brooders_farm_code_key ON public.brooders (farm_id, upper(brooder_code));
-- one ACTIVE brooder group per pond
CREATE UNIQUE INDEX brooders_active_pond_key ON public.brooders (farm_id, upper(pond_name)) WHERE health_status = 'active';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brooders TO authenticated;
GRANT ALL ON public.brooders TO service_role;
ALTER TABLE public.brooders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farm members read brooders" ON public.brooders FOR SELECT TO authenticated USING (public.is_farm_member(farm_id));
CREATE POLICY "Farm members insert brooders" ON public.brooders FOR INSERT TO authenticated WITH CHECK (public.is_farm_member(farm_id));
CREATE POLICY "Farm members update brooders" ON public.brooders FOR UPDATE TO authenticated USING (public.is_farm_member(farm_id)) WITH CHECK (public.is_farm_member(farm_id));
CREATE POLICY "Farm owners delete brooders" ON public.brooders FOR DELETE TO authenticated USING (public.is_farm_owner(farm_id));

CREATE TRIGGER trg_brooders_updated BEFORE UPDATE ON public.brooders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ FRY PRODUCTION BATCHES ============
CREATE TABLE public.hatchery_production (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  batch_code text NOT NULL,
  brooder_id uuid REFERENCES public.brooders(id) ON DELETE SET NULL,
  collected_date date NOT NULL DEFAULT CURRENT_DATE,
  total_collection integer NOT NULL DEFAULT 0,
  pond_stocked text NOT NULL,
  grading_date date,
  total_graded integer NOT NULL DEFAULT 0,
  survival_rate numeric NOT NULL DEFAULT 0,
  sold_amount integer NOT NULL DEFAULT 0,
  restocked_amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'stocked',
  staff text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX hatchery_production_farm_code_key ON public.hatchery_production (farm_id, upper(batch_code));
-- a pond can only hold one live fry batch at a time
CREATE UNIQUE INDEX hatchery_production_active_pond_key
  ON public.hatchery_production (farm_id, upper(pond_stocked))
  WHERE status <> 'sold';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hatchery_production TO authenticated;
GRANT ALL ON public.hatchery_production TO service_role;
ALTER TABLE public.hatchery_production ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farm members read hatchery production" ON public.hatchery_production FOR SELECT TO authenticated USING (public.is_farm_member(farm_id));
CREATE POLICY "Farm members insert hatchery production" ON public.hatchery_production FOR INSERT TO authenticated WITH CHECK (public.is_farm_member(farm_id));
CREATE POLICY "Farm members update hatchery production" ON public.hatchery_production FOR UPDATE TO authenticated USING (public.is_farm_member(farm_id)) WITH CHECK (public.is_farm_member(farm_id));
CREATE POLICY "Farm owners delete hatchery production" ON public.hatchery_production FOR DELETE TO authenticated USING (public.is_farm_owner(farm_id));

-- derive grading date, survival rate, restocked amount and status
CREATE OR REPLACE FUNCTION public.derive_hatchery_production()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.pond_stocked := upper(trim(NEW.pond_stocked));
  NEW.batch_code := upper(trim(NEW.batch_code));

  IF NEW.grading_date IS NULL AND NEW.collected_date IS NOT NULL THEN
    NEW.grading_date := NEW.collected_date + 25;
  END IF;

  IF COALESCE(NEW.total_collection,0) > 0 THEN
    NEW.survival_rate := ROUND((COALESCE(NEW.total_graded,0)::numeric / NEW.total_collection) * 100, 1);
  ELSE
    NEW.survival_rate := 0;
  END IF;

  NEW.restocked_amount := GREATEST(0, COALESCE(NEW.total_graded,0) - COALESCE(NEW.sold_amount,0));

  IF COALESCE(NEW.total_graded,0) = 0 THEN
    NEW.status := 'stocked';
  ELSIF NEW.restocked_amount > 0 THEN
    NEW.status := 'restocked';
  ELSE
    NEW.status := 'sold';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_derive_hatchery_production BEFORE INSERT OR UPDATE ON public.hatchery_production
  FOR EACH ROW EXECUTE FUNCTION public.derive_hatchery_production();

CREATE TRIGGER trg_hatchery_production_updated BEFORE UPDATE ON public.hatchery_production
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();