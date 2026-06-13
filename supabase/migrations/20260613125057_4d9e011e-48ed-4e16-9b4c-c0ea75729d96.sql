
-- 1. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id uuid REFERENCES public.farms(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);

-- 2. FEED STOCK TABLE
CREATE TABLE public.feed_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  feed_type text NOT NULL,
  quantity_kg numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  low_threshold_kg numeric NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (farm_id, feed_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_stock TO authenticated;
GRANT ALL ON public.feed_stock TO service_role;
ALTER TABLE public.feed_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farm owners manage feed stock" ON public.feed_stock
  FOR ALL TO authenticated USING (public.is_farm_owner(farm_id)) WITH CHECK (public.is_farm_owner(farm_id));
CREATE TRIGGER trg_feed_stock_updated BEFORE UPDATE ON public.feed_stock
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. MORTALITY → reduce batch count + notify
CREATE OR REPLACE FUNCTION public.apply_mortality_to_batch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _farm_id uuid; _user_id uuid; _name text; _current int; _initial int; _new_count int; _avg numeric;
BEGIN
  IF NEW.mortality_count IS NULL OR NEW.mortality_count <= 0 THEN RETURN NEW; END IF;
  SELECT fb.farm_id, fb.name, fb.current_count, fb.initial_count, fb.avg_weight, f.user_id
    INTO _farm_id, _name, _current, _initial, _avg, _user_id
  FROM public.fish_batches fb JOIN public.farms f ON f.id = fb.farm_id WHERE fb.id = NEW.batch_id;
  IF _farm_id IS NULL THEN RETURN NEW; END IF;
  _new_count := GREATEST(0, COALESCE(_current,0) - NEW.mortality_count);
  UPDATE public.fish_batches
    SET current_count = _new_count,
        mortality_rate = CASE WHEN _initial > 0 THEN ROUND(((_initial - _new_count)::numeric / _initial) * 100, 2) ELSE 0 END,
        biomass = ROUND((COALESCE(_avg,0) * _new_count)/1000.0, 2)
    WHERE id = NEW.batch_id;
  INSERT INTO public.notifications (user_id, farm_id, type, title, body, link)
  VALUES (_user_id, _farm_id, 'batch_alert',
    '💀 Mortality recorded · ' || _name,
    NEW.mortality_count || ' fish lost. Batch count is now ' || _new_count || '.',
    '/batches');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_apply_mortality ON public.health_records;
CREATE TRIGGER trg_apply_mortality AFTER INSERT ON public.health_records
  FOR EACH ROW EXECUTE FUNCTION public.apply_mortality_to_batch();

-- 4. FEEDING → deduct feed stock + low-stock notification
CREATE OR REPLACE FUNCTION public.deduct_feed_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _farm_id uuid; _user_id uuid; _new_qty numeric; _thresh numeric; _stock_id uuid;
BEGIN
  SELECT fb.farm_id, f.user_id INTO _farm_id, _user_id
    FROM public.fish_batches fb JOIN public.farms f ON f.id = fb.farm_id WHERE fb.id = NEW.batch_id;
  IF _farm_id IS NULL THEN RETURN NEW; END IF;
  SELECT id, GREATEST(0, quantity_kg - NEW.amount_kg), low_threshold_kg
    INTO _stock_id, _new_qty, _thresh
    FROM public.feed_stock WHERE farm_id = _farm_id AND feed_type = NEW.feed_type;
  IF _stock_id IS NOT NULL THEN
    UPDATE public.feed_stock SET quantity_kg = _new_qty WHERE id = _stock_id;
    IF _new_qty <= _thresh THEN
      INSERT INTO public.notifications (user_id, farm_id, type, title, body, link)
      VALUES (_user_id, _farm_id, 'feed_stock',
        '🌾 Low feed stock · ' || NEW.feed_type,
        'Only ' || _new_qty || ' kg of ' || NEW.feed_type || ' left. Restock soon.',
        '/feeding');
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_deduct_feed_stock ON public.feeding_logs;
CREATE TRIGGER trg_deduct_feed_stock AFTER INSERT ON public.feeding_logs
  FOR EACH ROW EXECUTE FUNCTION public.deduct_feed_stock();

-- 5. WATER QUALITY ALERT → also write personal notification
CREATE OR REPLACE FUNCTION public.check_water_quality_alerts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _farm_id uuid; _user_id uuid; _batch_name text; _concerns text[];
BEGIN
  SELECT fb.farm_id, fb.name, f.user_id INTO _farm_id, _batch_name, _user_id
    FROM public.fish_batches fb JOIN public.farms f ON f.id = fb.farm_id WHERE fb.id = NEW.batch_id;
  IF _farm_id IS NULL THEN RETURN NEW; END IF;
  _concerns := ARRAY[]::text[];
  IF NEW.temperature IS NOT NULL AND (NEW.temperature < 20 OR NEW.temperature > 32) THEN
    _concerns := array_append(_concerns, 'Temp ' || NEW.temperature || '°C out of 20-32');
  END IF;
  IF NEW.ph IS NOT NULL AND (NEW.ph < 6.5 OR NEW.ph > 8.5) THEN
    _concerns := array_append(_concerns, 'pH ' || NEW.ph || ' out of 6.5-8.5');
  END IF;
  IF NEW.dissolved_oxygen IS NOT NULL AND NEW.dissolved_oxygen < 5 THEN
    _concerns := array_append(_concerns, 'DO ' || NEW.dissolved_oxygen || ' mg/L too low');
  END IF;
  IF NEW.ammonia IS NOT NULL AND NEW.ammonia > 0.02 THEN
    _concerns := array_append(_concerns, 'Ammonia ' || NEW.ammonia || ' mg/L too high');
  END IF;
  IF NEW.nitrite IS NOT NULL AND NEW.nitrite > 0.1 THEN
    _concerns := array_append(_concerns, 'Nitrite ' || NEW.nitrite || ' mg/L too high');
  END IF;
  IF array_length(_concerns, 1) > 0 THEN
    INSERT INTO public.smart_alerts (farm_id, batch_id, type, title, description, source)
    VALUES (_farm_id, NEW.batch_id,
      CASE WHEN array_length(_concerns,1) >= 2 THEN 'danger' ELSE 'warning' END,
      '⚠️ Water Quality · ' || _batch_name, array_to_string(_concerns,'; '), 'water_reading');
    INSERT INTO public.notifications (user_id, farm_id, type, title, body, link)
    VALUES (_user_id, _farm_id, 'water_alert',
      '💧 Water alert · ' || _batch_name, array_to_string(_concerns,'; '), '/water?batchId=' || NEW.batch_id);
  END IF;
  RETURN NEW;
END $$;

-- Also notify on health records (besides existing alert)
CREATE OR REPLACE FUNCTION public.notify_health_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _farm_id uuid; _user_id uuid; _name text;
BEGIN
  SELECT fb.farm_id, fb.name, f.user_id INTO _farm_id, _name, _user_id
    FROM public.fish_batches fb JOIN public.farms f ON f.id = fb.farm_id WHERE fb.id = NEW.batch_id;
  IF _farm_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.severity IN ('medium','high') OR COALESCE(NEW.mortality_count,0) > 0 THEN
    INSERT INTO public.notifications (user_id, farm_id, type, title, body, link)
    VALUES (_user_id, _farm_id, 'health_alert',
      '🐟 Health · ' || _name, NEW.title, '/health?batchId=' || NEW.batch_id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_health ON public.health_records;
CREATE TRIGGER trg_notify_health AFTER INSERT ON public.health_records
  FOR EACH ROW EXECUTE FUNCTION public.notify_health_event();

-- 6. INVOICE PAID → financial_records + notification
CREATE OR REPLACE FUNCTION public.invoice_paid_to_financial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _user_id uuid;
BEGIN
  IF NEW.status = 'paid' AND COALESCE(OLD.status,'') <> 'paid' THEN
    -- avoid duplicates if trigger fires twice
    IF NOT EXISTS (SELECT 1 FROM public.financial_records WHERE description LIKE 'Invoice ' || NEW.id || '%') THEN
      INSERT INTO public.financial_records (farm_id, batch_id, record_type, category, amount, description, transaction_date)
      VALUES (NEW.farm_id, NEW.batch_id, 'revenue', 'Fish Sales', NEW.amount,
        'Invoice ' || NEW.id || ' · ' || NEW.item, COALESCE(NEW.paid_date, CURRENT_DATE));
    END IF;
    SELECT user_id INTO _user_id FROM public.farms WHERE id = NEW.farm_id;
    IF _user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, farm_id, type, title, body, link)
      VALUES (_user_id, NEW.farm_id, 'invoice_paid',
        '💰 Invoice paid', NEW.buyer_name || ' paid TZS ' || NEW.amount || ' for ' || NEW.item, '/financial');
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_invoice_paid ON public.invoices;
CREATE TRIGGER trg_invoice_paid AFTER UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.invoice_paid_to_financial();

-- 7. MARKETPLACE ORDER DELIVERED → financial_record for seller + notifications
CREATE OR REPLACE FUNCTION public.order_delivered_to_financial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _seller_farm uuid; _net numeric;
BEGIN
  -- Status notifications for any change
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.buyer_id, 'order_update',
      '📦 Order ' || NEW.status, NEW.listing_title || ' is now ' || NEW.status, '/marketplace');
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.seller_id, 'order_update',
      '📦 Order ' || NEW.status, NEW.listing_title || ' marked ' || NEW.status, '/my-listings');
  END IF;
  IF NEW.status = 'delivered' AND OLD.status <> 'delivered' THEN
    SELECT id INTO _seller_farm FROM public.farms WHERE user_id = NEW.seller_id ORDER BY created_at LIMIT 1;
    IF _seller_farm IS NOT NULL THEN
      _net := NEW.total - COALESCE(NEW.platform_fee, 0);
      IF NOT EXISTS (SELECT 1 FROM public.financial_records WHERE description LIKE 'Marketplace order ' || NEW.id || '%') THEN
        INSERT INTO public.financial_records (farm_id, record_type, category, amount, description, transaction_date)
        VALUES (_seller_farm, 'revenue', 'Marketplace', _net,
          'Marketplace order ' || NEW.id || ' · ' || NEW.listing_title, CURRENT_DATE);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_order_delivered ON public.marketplace_orders;
CREATE TRIGGER trg_order_delivered AFTER UPDATE ON public.marketplace_orders
  FOR EACH ROW EXECUTE FUNCTION public.order_delivered_to_financial();
