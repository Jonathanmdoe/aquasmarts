
-- 1) marketplace_notifications: explicit deny INSERT for authenticated/anon
DROP POLICY IF EXISTS "No client inserts on notifications" ON public.marketplace_notifications;
CREATE POLICY "No client inserts on notifications"
  ON public.marketplace_notifications
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

-- 2) platform_settings: restrict reads to authenticated users
DROP POLICY IF EXISTS "Anyone reads settings" ON public.platform_settings;
CREATE POLICY "Authenticated reads settings"
  ON public.platform_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- 3) profiles: split ALL policy; block self-modification of suspension fields
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;

CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.protect_profile_suspension_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role (edge functions / admin) to bypass
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.is_suspended IS DISTINCT FROM OLD.is_suspended
     OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
     OR NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason THEN
    RAISE EXCEPTION 'Suspension fields can only be modified by administrators';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_suspension ON public.profiles;
CREATE TRIGGER protect_profile_suspension
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_suspension_fields();

-- 4) marketplace_orders: restrict sellers to fulfilment-only columns via trigger
CREATE OR REPLACE FUNCTION public.restrict_seller_order_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role (edge functions) may change anything
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  -- If the actor is the seller (not the buyer), only allow fulfilment fields to change
  IF auth.uid() = OLD.seller_id AND auth.uid() <> OLD.buyer_id THEN
    IF NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
       OR NEW.seller_id IS DISTINCT FROM OLD.seller_id
       OR NEW.listing_id IS DISTINCT FROM OLD.listing_id
       OR NEW.listing_title IS DISTINCT FROM OLD.listing_title
       OR NEW.quantity IS DISTINCT FROM OLD.quantity
       OR NEW.unit_price IS DISTINCT FROM OLD.unit_price
       OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
       OR NEW.total IS DISTINCT FROM OLD.total
       OR NEW.platform_fee IS DISTINCT FROM OLD.platform_fee
       OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
       OR NEW.stripe_payment_intent IS DISTINCT FROM OLD.stripe_payment_intent
       OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
       OR NEW.placed_at IS DISTINCT FROM OLD.placed_at
       OR NEW.delivery_address IS DISTINCT FROM OLD.delivery_address
       OR NEW.delivery_type IS DISTINCT FROM OLD.delivery_type THEN
      RAISE EXCEPTION 'Sellers may only update fulfilment fields (status, tracking, eta, packed_at, shipped_at, delivered_at)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restrict_seller_order_updates ON public.marketplace_orders;
CREATE TRIGGER restrict_seller_order_updates
  BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_seller_order_updates();

-- 5) Realtime Authorization: enable RLS on realtime.messages so users only see their own topics
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read own topics" ON realtime.messages;
CREATE POLICY "Authenticated users read own topics"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Allow topics that embed the user's uid, or generic broadcast topics without a user scope
    (realtime.topic() LIKE '%' || auth.uid()::text || '%')
    OR realtime.topic() LIKE 'dispute-%'
    OR realtime.topic() LIKE 'mp-notifs%'
  );

DROP POLICY IF EXISTS "Authenticated users write own topics" ON realtime.messages;
CREATE POLICY "Authenticated users write own topics"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (realtime.topic() LIKE '%' || auth.uid()::text || '%')
    OR realtime.topic() LIKE 'dispute-%'
  );
