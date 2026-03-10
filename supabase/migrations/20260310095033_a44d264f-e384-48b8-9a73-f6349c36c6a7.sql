
-- Fix marketplace_listings RLS policies: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Anyone can read active listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users manage own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users update own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users delete own listings" ON public.marketplace_listings;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Anyone can read active listings"
  ON public.marketplace_listings FOR SELECT
  TO authenticated
  USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users insert own listings"
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
