
-- =========================
-- CART
-- =========================
CREATE TABLE public.marketplace_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_cart_items TO authenticated;
GRANT ALL ON public.marketplace_cart_items TO service_role;
ALTER TABLE public.marketplace_cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cart" ON public.marketplace_cart_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================
-- ORDERS
-- =========================
CREATE TABLE public.marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE RESTRICT,
  listing_title text NOT NULL,
  unit_price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  subtotal numeric NOT NULL,
  platform_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL,
  delivery_type text NOT NULL DEFAULT 'standard',
  delivery_address text,
  status text NOT NULL DEFAULT 'placed' CHECK (status IN ('placed','packed','shipped','delivered','cancelled','refunded')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  stripe_session_id text,
  stripe_payment_intent text,
  eta date,
  tracking_number text,
  placed_at timestamptz NOT NULL DEFAULT now(),
  packed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_orders TO authenticated;
GRANT ALL ON public.marketplace_orders TO service_role;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers view own orders" ON public.marketplace_orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers view own orders" ON public.marketplace_orders FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Buyers insert own orders" ON public.marketplace_orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers update own orders" ON public.marketplace_orders FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Buyers can cancel own pending orders" ON public.marketplace_orders FOR UPDATE USING (auth.uid() = buyer_id AND status = 'placed');

CREATE TRIGGER set_marketplace_orders_updated_at
  BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =========================
-- DISPUTES
-- =========================
CREATE TABLE public.marketplace_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','escalated','refunded')),
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.marketplace_disputes TO authenticated;
GRANT ALL ON public.marketplace_disputes TO service_role;
ALTER TABLE public.marketplace_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties view disputes" ON public.marketplace_disputes FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Parties open disputes" ON public.marketplace_disputes FOR INSERT
  WITH CHECK (auth.uid() = opened_by AND (auth.uid() = buyer_id OR auth.uid() = seller_id));
CREATE POLICY "Parties update disputes" ON public.marketplace_disputes FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE TRIGGER set_marketplace_disputes_updated_at
  BEFORE UPDATE ON public.marketplace_disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =========================
-- DISPUTE MESSAGES
-- =========================
CREATE TABLE public.marketplace_dispute_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.marketplace_disputes(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('buyer','seller','mediator')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.marketplace_dispute_messages TO authenticated;
GRANT ALL ON public.marketplace_dispute_messages TO service_role;
ALTER TABLE public.marketplace_dispute_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties read messages" ON public.marketplace_dispute_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.marketplace_disputes d
    WHERE d.id = dispute_id AND (auth.uid() = d.buyer_id OR auth.uid() = d.seller_id)
  ));
CREATE POLICY "Parties send messages" ON public.marketplace_dispute_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.marketplace_disputes d
    WHERE d.id = dispute_id AND (auth.uid() = d.buyer_id OR auth.uid() = d.seller_id)
  ));

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE public.marketplace_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  related_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_notifications TO authenticated;
GRANT ALL ON public.marketplace_notifications TO service_role;
ALTER TABLE public.marketplace_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.marketplace_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.marketplace_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notifications" ON public.marketplace_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.marketplace_notifications FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- SELLER KYC
-- =========================
CREATE TABLE public.seller_kyc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  business_name text,
  business_type text,
  address text,
  country text,
  id_doc_type text,
  id_doc_number text,
  bank_name text,
  bank_account_number text,
  bank_account_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('draft','pending','approved','rejected')),
  notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.seller_kyc TO authenticated;
GRANT ALL ON public.seller_kyc TO service_role;
ALTER TABLE public.seller_kyc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own kyc" ON public.seller_kyc FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_seller_kyc_updated_at
  BEFORE UPDATE ON public.seller_kyc
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =========================
-- SELLER STRIPE ACCOUNTS
-- =========================
CREATE TABLE public.seller_stripe_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_account_id text NOT NULL,
  charges_enabled boolean NOT NULL DEFAULT false,
  payouts_enabled boolean NOT NULL DEFAULT false,
  details_submitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.seller_stripe_accounts TO authenticated;
GRANT ALL ON public.seller_stripe_accounts TO service_role;
ALTER TABLE public.seller_stripe_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own stripe account" ON public.seller_stripe_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own stripe account" ON public.seller_stripe_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own stripe account" ON public.seller_stripe_accounts FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER set_seller_stripe_accounts_updated_at
  BEFORE UPDATE ON public.seller_stripe_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =========================
-- Realtime for live tracking & chat
-- =========================
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_dispute_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_notifications;

-- Indexes
CREATE INDEX idx_orders_buyer ON public.marketplace_orders(buyer_id);
CREATE INDEX idx_orders_seller ON public.marketplace_orders(seller_id);
CREATE INDEX idx_notifs_user_unread ON public.marketplace_notifications(user_id, read);
CREATE INDEX idx_dispute_msgs_dispute ON public.marketplace_dispute_messages(dispute_id, created_at);
