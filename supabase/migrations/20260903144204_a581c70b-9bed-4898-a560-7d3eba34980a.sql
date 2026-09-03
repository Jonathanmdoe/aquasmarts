
CREATE OR REPLACE FUNCTION public.is_farm_member(_farm_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.farms WHERE id = _farm_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.farm_id = _farm_id AND tm.user_id = auth.uid() AND tm.is_active);
$$;

CREATE OR REPLACE FUNCTION public.is_batch_farm_member(_batch_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fish_batches b WHERE b.id = _batch_id AND public.is_farm_member(b.farm_id)
  );
$$;

CREATE POLICY "Team members view batches" ON public.fish_batches
  FOR SELECT TO authenticated USING (public.is_farm_member(farm_id));
CREATE POLICY "Team members update batches" ON public.fish_batches
  FOR UPDATE TO authenticated USING (public.is_farm_member(farm_id)) WITH CHECK (public.is_farm_member(farm_id));

CREATE POLICY "Team members manage feeding" ON public.feeding_logs
  FOR ALL TO authenticated USING (public.is_batch_farm_member(batch_id)) WITH CHECK (public.is_batch_farm_member(batch_id));

CREATE POLICY "Team members manage water" ON public.water_readings
  FOR ALL TO authenticated USING (public.is_batch_farm_member(batch_id)) WITH CHECK (public.is_batch_farm_member(batch_id));

CREATE POLICY "Team members manage health" ON public.health_records
  FOR ALL TO authenticated USING (public.is_batch_farm_member(batch_id)) WITH CHECK (public.is_batch_farm_member(batch_id));

CREATE POLICY "Team members view feed stock" ON public.feed_stock
  FOR SELECT TO authenticated USING (public.is_farm_member(farm_id));

CREATE POLICY "Team members manage growth samples" ON public.growth_samples
  FOR ALL TO authenticated USING (public.is_batch_farm_member(batch_id)) WITH CHECK (public.is_batch_farm_member(batch_id));

CREATE POLICY "Team members view alerts" ON public.smart_alerts
  FOR SELECT TO authenticated USING (public.is_farm_member(farm_id));

CREATE POLICY "Team members view biosecurity" ON public.biosecurity_checks
  FOR SELECT TO authenticated USING (public.is_farm_member(farm_id));
