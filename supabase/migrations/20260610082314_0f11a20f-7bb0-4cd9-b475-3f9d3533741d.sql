
-- Profiles: suspension + country
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Subscribers cache
CREATE TABLE IF NOT EXISTS public.subscribers_cache (
  user_id uuid PRIMARY KEY,
  plan text NOT NULL DEFAULT 'free',
  subscribed boolean NOT NULL DEFAULT false,
  total_spend_cents bigint NOT NULL DEFAULT 0,
  mtd_spend_cents bigint NOT NULL DEFAULT 0,
  trade_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscribers_cache TO authenticated;
GRANT ALL ON public.subscribers_cache TO service_role;
ALTER TABLE public.subscribers_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin reads subscribers cache"
  ON public.subscribers_cache FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR auth.uid() = user_id);

-- Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Staff read all tickets" ON public.support_tickets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'support_agent') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Staff update tickets" ON public.support_tickets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'support_agent'));

CREATE TABLE IF NOT EXISTS public.ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  is_staff boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ticket_replies TO authenticated;
GRANT ALL ON public.ticket_replies TO service_role;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reply visibility" ON public.ticket_replies FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'support_agent') OR
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Reply insert" ON public.ticket_replies FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND (
      public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'support_agent') OR
      EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
    )
  );

-- Platform settings (singleton row)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  price_basic_cents bigint NOT NULL DEFAULT 0,
  price_pro_cents bigint NOT NULL DEFAULT 2999,
  price_enterprise_cents bigint NOT NULL DEFAULT 9999,
  commission_rate numeric(5,2) NOT NULL DEFAULT 5.00,
  marketplace_open boolean NOT NULL DEFAULT true,
  new_registrations boolean NOT NULL DEFAULT true,
  assured_delivery boolean NOT NULL DEFAULT true,
  free_user_listings boolean NOT NULL DEFAULT true,
  kyc_required boolean NOT NULL DEFAULT false,
  ai_advisor boolean NOT NULL DEFAULT true,
  dispute_auto_escalation boolean NOT NULL DEFAULT false,
  maintenance_mode boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
GRANT SELECT ON public.platform_settings TO authenticated, anon;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.platform_settings FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Super admin updates settings" ON public.platform_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Moderation flags
CREATE TABLE IF NOT EXISTS public.moderation_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  flagged_by uuid,
  reason text NOT NULL,
  risk_level text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid,
  reviewer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT SELECT, INSERT ON public.moderation_flags TO authenticated;
GRANT ALL ON public.moderation_flags TO service_role;
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can flag listings" ON public.moderation_flags FOR INSERT TO authenticated WITH CHECK (auth.uid() = flagged_by);
CREATE POLICY "Staff read flags" ON public.moderation_flags FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Staff update flags" ON public.moderation_flags FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'moderator'));

-- Broadcasts
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  audience text NOT NULL DEFAULT 'all',
  recipient_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.broadcast_messages TO authenticated;
GRANT ALL ON public.broadcast_messages TO service_role;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin read broadcasts" ON public.broadcast_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin send broadcasts" ON public.broadcast_messages FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') AND auth.uid() = sender_id);

-- Admin activity log
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_activity_log TO authenticated;
GRANT ALL ON public.admin_activity_log TO service_role;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff reads activity" ON public.admin_activity_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'moderator'));

-- Updated_at triggers
DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER trg_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-promote first farm owner to super_admin (one-time seed)
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'super_admin'::public.app_role FROM public.farms
ON CONFLICT DO NOTHING;
