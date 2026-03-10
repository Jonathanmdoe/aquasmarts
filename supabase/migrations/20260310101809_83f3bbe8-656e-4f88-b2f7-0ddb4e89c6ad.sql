-- Fix farms RLS
DROP POLICY IF EXISTS "Users manage own farms" ON public.farms;
CREATE POLICY "Users manage own farms" ON public.farms FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fix fish_batches RLS
DROP POLICY IF EXISTS "Farm owners manage batches" ON public.fish_batches;
CREATE POLICY "Farm owners manage batches" ON public.fish_batches FOR ALL TO public USING (is_farm_owner(farm_id)) WITH CHECK (is_farm_owner(farm_id));

-- Fix feeding_logs RLS
DROP POLICY IF EXISTS "Batch owners manage feeding" ON public.feeding_logs;
CREATE POLICY "Batch owners manage feeding" ON public.feeding_logs FOR ALL TO public USING (is_batch_farm_owner(batch_id)) WITH CHECK (is_batch_farm_owner(batch_id));

-- Fix water_readings RLS
DROP POLICY IF EXISTS "Batch owners manage water" ON public.water_readings;
CREATE POLICY "Batch owners manage water" ON public.water_readings FOR ALL TO public USING (is_batch_farm_owner(batch_id)) WITH CHECK (is_batch_farm_owner(batch_id));

-- Fix health_records RLS
DROP POLICY IF EXISTS "Batch owners manage health" ON public.health_records;
CREATE POLICY "Batch owners manage health" ON public.health_records FOR ALL TO public USING (is_batch_farm_owner(batch_id)) WITH CHECK (is_batch_farm_owner(batch_id));

-- Fix financial_records RLS
DROP POLICY IF EXISTS "Farm owners manage financials" ON public.financial_records;
CREATE POLICY "Farm owners manage financials" ON public.financial_records FOR ALL TO public USING (is_farm_owner(farm_id)) WITH CHECK (is_farm_owner(farm_id));

-- Fix smart_alerts RLS
DROP POLICY IF EXISTS "Farm owners manage alerts" ON public.smart_alerts;
CREATE POLICY "Farm owners manage alerts" ON public.smart_alerts FOR ALL TO public USING (is_farm_owner(farm_id)) WITH CHECK (is_farm_owner(farm_id));

-- Fix biosecurity_checks RLS
DROP POLICY IF EXISTS "Farm owners manage biosecurity" ON public.biosecurity_checks;
CREATE POLICY "Farm owners manage biosecurity" ON public.biosecurity_checks FOR ALL TO public USING (is_farm_owner(farm_id)) WITH CHECK (is_farm_owner(farm_id));

-- Fix team_members RLS
DROP POLICY IF EXISTS "Farm owners manage team members" ON public.team_members;
CREATE POLICY "Farm owners manage team members" ON public.team_members FOR ALL TO public USING (is_farm_owner(farm_id)) WITH CHECK (is_farm_owner(farm_id));
DROP POLICY IF EXISTS "Team members can read own membership" ON public.team_members;
CREATE POLICY "Team members can read own membership" ON public.team_members FOR SELECT TO public USING (auth.uid() = user_id);

-- Fix team_invitations RLS
DROP POLICY IF EXISTS "Farm owners manage invitations" ON public.team_invitations;
CREATE POLICY "Farm owners manage invitations" ON public.team_invitations FOR ALL TO public USING (is_farm_owner(farm_id)) WITH CHECK (is_farm_owner(farm_id));

-- Fix user_roles RLS
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO public USING (auth.uid() = user_id);

-- Fix profiles RLS
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fix marketplace_listings RLS
DROP POLICY IF EXISTS "Anyone can read active listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users delete own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users insert own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users update own listings" ON public.marketplace_listings;
CREATE POLICY "Anyone can read active listings" ON public.marketplace_listings FOR SELECT TO authenticated USING ((status = 'active') OR (auth.uid() = user_id));
CREATE POLICY "Users insert own listings" ON public.marketplace_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own listings" ON public.marketplace_listings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own listings" ON public.marketplace_listings FOR DELETE TO authenticated USING (auth.uid() = user_id);