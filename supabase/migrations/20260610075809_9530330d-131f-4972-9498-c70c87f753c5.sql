
-- 1) marketplace_disputes: restrict party updates to non-resolution fields
DROP POLICY IF EXISTS "Parties update disputes" ON public.marketplace_disputes;
CREATE POLICY "Parties update disputes"
  ON public.marketplace_disputes
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = buyer_id) OR (auth.uid() = seller_id))
  WITH CHECK (
    (auth.uid() = buyer_id OR auth.uid() = seller_id)
    AND status = (SELECT status FROM public.marketplace_disputes d WHERE d.id = marketplace_disputes.id)
    AND resolution IS NOT DISTINCT FROM (SELECT resolution FROM public.marketplace_disputes d WHERE d.id = marketplace_disputes.id)
    AND resolved_at IS NOT DISTINCT FROM (SELECT resolved_at FROM public.marketplace_disputes d WHERE d.id = marketplace_disputes.id)
  );

-- 2) marketplace_orders: buyer cancel-only update
DROP POLICY IF EXISTS "Buyers can cancel own pending orders" ON public.marketplace_orders;
CREATE POLICY "Buyers can cancel own pending orders"
  ON public.marketplace_orders
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = buyer_id) AND (status = 'placed'::text))
  WITH CHECK ((auth.uid() = buyer_id) AND (status = 'cancelled'::text));

-- 3) marketplace_notifications: remove client INSERT; service role handles inserts
DROP POLICY IF EXISTS "Users insert own notifications" ON public.marketplace_notifications;

-- 4) seller_kyc: replace ALL policy with explicit SELECT/INSERT/UPDATE; no DELETE
DROP POLICY IF EXISTS "Users manage own kyc" ON public.seller_kyc;
CREATE POLICY "Users view own kyc"
  ON public.seller_kyc
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own kyc"
  ON public.seller_kyc
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own kyc"
  ON public.seller_kyc
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending'::text)
  WITH CHECK (auth.uid() = user_id);
