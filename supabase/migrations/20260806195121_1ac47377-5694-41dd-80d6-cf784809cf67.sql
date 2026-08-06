CREATE TABLE public.growth_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.fish_batches(id) ON DELETE CASCADE,
  sample_date date NOT NULL DEFAULT CURRENT_DATE,
  avg_weight_g numeric NOT NULL,
  avg_length_cm numeric,
  sample_size integer NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.growth_samples TO authenticated;
GRANT ALL ON public.growth_samples TO service_role;

ALTER TABLE public.growth_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farm team manages growth samples"
ON public.growth_samples FOR ALL TO authenticated
USING (public.is_batch_farm_owner(batch_id) OR EXISTS (
  SELECT 1 FROM public.fish_batches b
  JOIN public.team_members tm ON tm.farm_id = b.farm_id
  WHERE b.id = growth_samples.batch_id AND tm.user_id = auth.uid() AND tm.is_active
))
WITH CHECK (public.is_batch_farm_owner(batch_id) OR EXISTS (
  SELECT 1 FROM public.fish_batches b
  JOIN public.team_members tm ON tm.farm_id = b.farm_id
  WHERE b.id = growth_samples.batch_id AND tm.user_id = auth.uid() AND tm.is_active
));

CREATE INDEX idx_growth_samples_batch_date ON public.growth_samples(batch_id, sample_date);

CREATE TRIGGER trg_growth_samples_updated
BEFORE UPDATE ON public.growth_samples
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.apply_growth_sample()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _count int;
BEGIN
  SELECT current_count INTO _count FROM public.fish_batches WHERE id = NEW.batch_id;
  UPDATE public.fish_batches
    SET avg_weight = NEW.avg_weight_g,
        biomass = ROUND((NEW.avg_weight_g * COALESCE(_count,0)) / 1000.0, 2)
    WHERE id = NEW.batch_id;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_apply_growth_sample
AFTER INSERT ON public.growth_samples
FOR EACH ROW EXECUTE FUNCTION public.apply_growth_sample();