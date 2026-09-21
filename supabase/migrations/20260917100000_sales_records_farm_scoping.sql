-- Sales belong to a FARM, not just to the user who typed them in.
--
-- Before: sales_records had only seller_id and one RLS policy `auth.uid() = seller_id`,
-- so a manager's sales were invisible to the farm owner (and vice-versa).
-- After:  each sale carries farm_id; the farm's owner and its ACTIVE managers can
-- see/edit the farm's sales, while seller_id keeps recording WHO entered each one.
--
-- Non-destructive: no rows are deleted, no table is recreated. Historical rows are
-- mapped to a farm ONLY when that is unambiguous (see step 3); every other row keeps
-- farm_id NULL and stays visible to its recorder, exactly as before.

-- 1. Column -----------------------------------------------------------------------
ALTER TABLE public.sales_records
  ADD COLUMN IF NOT EXISTS farm_id uuid REFERENCES public.farms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sales_records_farm ON public.sales_records (farm_id, created_at DESC);

-- 2. Who may manage a farm's sales: the owner, or an active owner/manager member.
--    Workers are deliberately excluded (the Sales screen is owner/manager-only).
CREATE OR REPLACE FUNCTION public.can_manage_farm_sales(_farm_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.farms f WHERE f.id = _farm_id AND f.user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.farm_id = _farm_id AND tm.user_id = auth.uid()
          AND tm.is_active AND tm.role IN ('owner', 'manager')
      );
$$;

-- 3. Conservative backfill --------------------------------------------------------
-- A historical sale is attached to a farm only if its seller has EXACTLY ONE
-- candidate farm (a farm they own, or one they actively own/manage as a member).
-- Sellers with several candidate farms, or none, are left NULL on purpose:
-- guessing would put a sale on the wrong farm.
-- (updated_at trigger paused so the backfill does not rewrite modification times.)
ALTER TABLE public.sales_records DISABLE TRIGGER update_sales_records_updated_at;

WITH candidates AS (
  SELECT s.id AS sale_id, f.id AS farm_id
  FROM public.sales_records s
  JOIN public.farms f ON f.user_id = s.seller_id
  WHERE s.farm_id IS NULL
  UNION
  SELECT s.id, tm.farm_id
  FROM public.sales_records s
  JOIN public.team_members tm ON tm.user_id = s.seller_id AND tm.is_active AND tm.role IN ('owner', 'manager')
  WHERE s.farm_id IS NULL
),
unambiguous AS (
  SELECT sale_id, (array_agg(farm_id))[1] AS farm_id
  FROM candidates
  GROUP BY sale_id
  HAVING count(DISTINCT farm_id) = 1
)
UPDATE public.sales_records s
SET farm_id = u.farm_id
FROM unambiguous u
WHERE s.id = u.sale_id AND s.farm_id IS NULL;

ALTER TABLE public.sales_records ENABLE TRIGGER update_sales_records_updated_at;

-- Rows that could NOT be mapped safely and need a human decision:
--   SELECT id, seller_id, buyer_name, total_amount, created_at
--   FROM public.sales_records WHERE farm_id IS NULL ORDER BY seller_id, created_at;
-- Each stays visible to its own seller. Assign one manually, e.g.:
--   UPDATE public.sales_records SET farm_id = '<farm uuid>' WHERE id = '<sale uuid>';

-- 4. Accountability: who recorded a sale, and which farm it is on, cannot be rewritten.
CREATE OR REPLACE FUNCTION public.sales_records_guard_ownership()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.seller_id IS DISTINCT FROM OLD.seller_id THEN
    RAISE EXCEPTION 'sales_records.seller_id cannot be changed';
  END IF;
  IF OLD.farm_id IS NOT NULL AND NEW.farm_id IS DISTINCT FROM OLD.farm_id THEN
    RAISE EXCEPTION 'sales_records.farm_id cannot be changed once set';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sales_records_guard_ownership ON public.sales_records;
CREATE TRIGGER trg_sales_records_guard_ownership
  BEFORE UPDATE ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION public.sales_records_guard_ownership();

-- 5. Row-level security -----------------------------------------------------------
DROP POLICY IF EXISTS "Sellers manage own sales" ON public.sales_records;
DROP POLICY IF EXISTS "Farm managers read sales" ON public.sales_records;
DROP POLICY IF EXISTS "Farm managers insert sales" ON public.sales_records;
DROP POLICY IF EXISTS "Farm managers update sales" ON public.sales_records;
DROP POLICY IF EXISTS "Farm owners or recorders delete sales" ON public.sales_records;

-- Read: the farm's owner + active managers; unmapped legacy rows: only their seller.
CREATE POLICY "Farm managers read sales" ON public.sales_records
  FOR SELECT TO authenticated
  USING (
    (farm_id IS NOT NULL AND public.can_manage_farm_sales(farm_id))
    OR (farm_id IS NULL AND seller_id = auth.uid())
  );

-- Insert: you record as yourself, on a farm you may manage. farm_id is mandatory.
CREATE POLICY "Farm managers insert sales" ON public.sales_records
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = auth.uid() AND farm_id IS NOT NULL AND public.can_manage_farm_sales(farm_id)
  );

-- Update (e.g. delivery status): same audience as read; the row must stay in scope.
CREATE POLICY "Farm managers update sales" ON public.sales_records
  FOR UPDATE TO authenticated
  USING (
    (farm_id IS NOT NULL AND public.can_manage_farm_sales(farm_id))
    OR (farm_id IS NULL AND seller_id = auth.uid())
  )
  WITH CHECK (
    (farm_id IS NOT NULL AND public.can_manage_farm_sales(farm_id))
    OR (farm_id IS NULL AND seller_id = auth.uid())
  );

-- Delete: the farm owner, or the manager who recorded the sale (while still a manager).
CREATE POLICY "Farm owners or recorders delete sales" ON public.sales_records
  FOR DELETE TO authenticated
  USING (
    (farm_id IS NOT NULL AND public.can_manage_farm_sales(farm_id)
       AND (public.is_farm_owner(farm_id) OR seller_id = auth.uid()))
    OR (farm_id IS NULL AND seller_id = auth.uid())
  );
