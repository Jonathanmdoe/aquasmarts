-- 1. M-Pesa auto-approve becomes opt-in.
-- Submitted confirmation codes are never checked against M-Pesa, so auto-approve
-- activated a plan or order for any made-up code. It now defaults to OFF and the
-- current setting is switched off; a super admin can turn it back on in Admin
-- (the edge function only auto-approves when the value is exactly true).
ALTER TABLE public.platform_settings ALTER COLUMN mpesa_auto_approve SET DEFAULT false;
UPDATE public.platform_settings SET mpesa_auto_approve = false WHERE id = 1;

-- 2. Workers may record inventory USAGE only.
-- A purchase with a unit cost writes an expense into financial_records through a
-- SECURITY DEFINER trigger, which let workers (who cannot see finances) create
-- expenses. Purchases and adjustments now need an owner/manager.
DROP POLICY IF EXISTS "Farm members record inventory movements" ON public.inventory_movements;
CREATE POLICY "Farm members record inventory movements" ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (
    recorded_by = auth.uid()
    AND public.is_farm_member(farm_id)
    AND (movement_type = 'usage' OR public.can_manage_farm_sales(farm_id))
  );
