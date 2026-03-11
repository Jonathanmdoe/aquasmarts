
-- Fix ALL policies to be PERMISSIVE (they are currently all RESTRICTIVE)

-- farms
DROP POLICY IF EXISTS "Users manage own farms" ON public.farms;
CREATE POLICY "Users manage own farms" ON public.farms AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- fish_batches
DROP POLICY IF EXISTS "Farm owners manage batches" ON public.fish_batches;
CREATE POLICY "Farm owners manage batches" ON public.fish_batches AS PERMISSIVE FOR ALL TO authenticated USING (is_farm_owner(farm_id)) WITH CHECK (is_farm_owner(farm_id));

-- feeding_logs
DROP POLICY IF EXISTS "Batch owners manage feeding" ON public.feeding_logs;
CREATE POLICY "Batch owners manage feeding" ON public.feeding_logs AS PERMISSIVE FOR ALL TO authenticated USING (is_batch_farm_owner(batch_id)) WITH CHECK (is_batch_farm_owner(batch_id));

-- water_readings
DROP POLICY IF EXISTS "Batch owners manage water" ON public.water_readings;
CREATE POLICY "Batch owners manage water" ON public.water_readings AS PERMISSIVE FOR ALL TO authenticated USING (is_batch_farm_owner(batch_id)) WITH CHECK (is_batch_farm_owner(batch_id));

-- health_records
DROP POLICY IF EXISTS "Batch owners manage health" ON public.health_records;
CREATE POLICY "Batch owners manage health" ON public.health_records AS PERMISSIVE FOR ALL TO authenticated USING (is_batch_farm_owner(batch_id)) WITH CHECK (is_batch_farm_owner(batch_id));

-- financial_records
DROP POLICY IF EXISTS "Farm owners manage financials" ON public.financial_records;
CREATE POLICY "Farm owners manage financials" ON public.financial_records AS PERMISSIVE FOR ALL TO authenticated USING (is_farm_owner(farm_id)) WITH CHECK (is_farm_owner(farm_id));

-- smart_alerts
DROP POLICY IF EXISTS "Farm owners manage alerts" ON public.smart_alerts;
CREATE POLICY "Farm owners manage alerts" ON public.smart_alerts AS PERMISSIVE FOR ALL TO authenticated USING (is_farm_owner(farm_id)) WITH CHECK (is_farm_owner(farm_id));

-- biosecurity_checks
DROP POLICY IF EXISTS "Farm owners manage biosecurity" ON public.biosecurity_checks;
CREATE POLICY "Farm owners manage biosecurity" ON public.biosecurity_checks AS PERMISSIVE FOR ALL TO authenticated USING (is_farm_owner(farm_id)) WITH CHECK (is_farm_owner(farm_id));

-- team_members
DROP POLICY IF EXISTS "Farm owners manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can read own membership" ON public.team_members;
CREATE POLICY "Farm owners manage team members" ON public.team_members AS PERMISSIVE FOR ALL TO authenticated USING (is_farm_owner(farm_id)) WITH CHECK (is_farm_owner(farm_id));
CREATE POLICY "Team members can read own membership" ON public.team_members AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- team_invitations
DROP POLICY IF EXISTS "Farm owners manage invitations" ON public.team_invitations;
CREATE POLICY "Farm owners manage invitations" ON public.team_invitations AS PERMISSIVE FOR ALL TO authenticated USING (is_farm_owner(farm_id)) WITH CHECK (is_farm_owner(farm_id));

-- user_roles
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
CREATE POLICY "Users manage own profile" ON public.profiles AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- marketplace_listings
DROP POLICY IF EXISTS "Anyone can read active listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users insert own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users update own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users delete own listings" ON public.marketplace_listings;
CREATE POLICY "Anyone can read active listings" ON public.marketplace_listings AS PERMISSIVE FOR SELECT TO authenticated USING ((status = 'active') OR (auth.uid() = user_id));
CREATE POLICY "Users insert own listings" ON public.marketplace_listings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own listings" ON public.marketplace_listings AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own listings" ON public.marketplace_listings AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);
