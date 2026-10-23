-- Shared operations for grow-out and hatchery farms, plus a traceable fry transfer.

-- General inventory. Feed remains in feed_stock because feeding logs already deduct it.
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  unit text NOT NULL DEFAULT 'unit',
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold numeric NOT NULL DEFAULT 0 CHECK (low_stock_threshold >= 0),
  unit_cost numeric NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  supplier text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX inventory_items_farm_name_key ON public.inventory_items(farm_id, lower(name));
CREATE INDEX inventory_items_farm_category_idx ON public.inventory_items(farm_id, category);
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
CREATE POLICY "Farm members read inventory" ON public.inventory_items FOR SELECT TO authenticated
  USING (public.is_farm_member(farm_id));
CREATE POLICY "Farm managers manage inventory" ON public.inventory_items FOR ALL TO authenticated
  USING (public.can_manage_farm_sales(farm_id)) WITH CHECK (public.can_manage_farm_sales(farm_id));
CREATE TRIGGER trg_inventory_items_updated BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  movement_type text NOT NULL CHECK (movement_type IN ('purchase', 'usage', 'adjustment')),
  quantity_delta numeric NOT NULL CHECK (quantity_delta <> 0),
  unit_cost numeric CHECK (unit_cost >= 0),
  reference text,
  notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inventory_movements_item_date_idx ON public.inventory_movements(item_id, occurred_at DESC);
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
CREATE POLICY "Farm members read inventory movements" ON public.inventory_movements FOR SELECT TO authenticated
  USING (public.is_farm_member(farm_id));
CREATE POLICY "Farm members record inventory movements" ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (public.is_farm_member(farm_id) AND recorded_by = auth.uid());

CREATE OR REPLACE FUNCTION public.apply_inventory_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _item public.inventory_items%ROWTYPE;
BEGIN
  SELECT * INTO _item FROM public.inventory_items WHERE id = NEW.item_id AND farm_id = NEW.farm_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inventory item does not belong to this farm'; END IF;
  IF NEW.movement_type = 'purchase' AND NEW.quantity_delta <= 0 THEN
    RAISE EXCEPTION 'Purchase quantity must be positive';
  ELSIF NEW.movement_type = 'usage' AND NEW.quantity_delta >= 0 THEN
    RAISE EXCEPTION 'Usage quantity must be negative';
  END IF;
  IF _item.quantity + NEW.quantity_delta < 0 THEN RAISE EXCEPTION 'Insufficient inventory'; END IF;
  UPDATE public.inventory_items
  SET quantity = quantity + NEW.quantity_delta,
      unit_cost = CASE WHEN NEW.movement_type = 'purchase' AND NEW.unit_cost IS NOT NULL THEN NEW.unit_cost ELSE unit_cost END,
      supplier = CASE WHEN NEW.movement_type = 'purchase' AND NEW.reference IS NOT NULL THEN NEW.reference ELSE supplier END
  WHERE id = NEW.item_id;
  IF NEW.movement_type = 'purchase' AND COALESCE(NEW.unit_cost, 0) > 0 THEN
    INSERT INTO public.financial_records (farm_id, record_type, category, description, amount, transaction_date)
    VALUES (
      NEW.farm_id, 'expense', 'inventory',
      'Inventory purchase: ' || _item.name || COALESCE(' · ' || NULLIF(NEW.reference, ''), ''),
      NEW.quantity_delta * NEW.unit_cost, COALESCE(NEW.occurred_at::date, CURRENT_DATE)
    );
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_apply_inventory_movement BEFORE INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_movement();

-- Feed has its own live balance because feeding logs deduct it automatically.
CREATE TABLE public.feed_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  feed_type text NOT NULL,
  quantity_kg numeric NOT NULL CHECK (quantity_kg > 0),
  unit_cost numeric NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  supplier text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX feed_stock_movements_farm_date_idx ON public.feed_stock_movements(farm_id, occurred_at DESC);
ALTER TABLE public.feed_stock_movements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.feed_stock_movements TO authenticated;
CREATE POLICY "Farm members read feed purchases" ON public.feed_stock_movements FOR SELECT TO authenticated
  USING (public.is_farm_member(farm_id));
CREATE POLICY "Farm members record feed purchases" ON public.feed_stock_movements FOR INSERT TO authenticated
  WITH CHECK (public.is_farm_member(farm_id) AND recorded_by = auth.uid());

CREATE OR REPLACE FUNCTION public.apply_feed_stock_purchase()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _feed public.feed_stock%ROWTYPE;
BEGIN
  SELECT * INTO _feed FROM public.feed_stock WHERE farm_id = NEW.farm_id AND feed_type = NEW.feed_type FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Feed type is not configured for this farm'; END IF;
  UPDATE public.feed_stock SET quantity_kg = quantity_kg + NEW.quantity_kg, unit_cost = NEW.unit_cost
    WHERE id = _feed.id;
  IF NEW.unit_cost > 0 THEN
    INSERT INTO public.financial_records (farm_id, record_type, category, description, amount, transaction_date)
    VALUES (NEW.farm_id, 'expense', 'feed', 'Feed purchase: ' || NEW.feed_type || COALESCE(' · ' || NULLIF(NEW.supplier, ''), ''), NEW.quantity_kg * NEW.unit_cost, NEW.occurred_at::date);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_apply_feed_stock_purchase BEFORE INSERT ON public.feed_stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_feed_stock_purchase();

CREATE OR REPLACE FUNCTION public.record_feed_stock_purchase(
  _farm_id uuid, _feed_type text, _quantity_kg numeric, _unit_cost numeric DEFAULT 0, _supplier text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _movement_id uuid; _type text;
BEGIN
  IF NOT public.is_farm_member(_farm_id) THEN RAISE EXCEPTION 'Farm not found for this account'; END IF;
  _type := trim(_feed_type);
  IF _type = '' OR _quantity_kg IS NULL OR _quantity_kg <= 0 OR COALESCE(_unit_cost, 0) < 0 THEN
    RAISE EXCEPTION 'Enter a feed type, positive quantity, and valid unit cost';
  END IF;
  INSERT INTO public.feed_stock (farm_id, feed_type, quantity_kg, unit_cost)
  VALUES (_farm_id, _type, 0, COALESCE(_unit_cost, 0))
  ON CONFLICT (farm_id, feed_type) DO NOTHING;
  INSERT INTO public.feed_stock_movements (farm_id, feed_type, quantity_kg, unit_cost, supplier, recorded_by)
  VALUES (_farm_id, _type, _quantity_kg, COALESCE(_unit_cost, 0), NULLIF(trim(_supplier), ''), auth.uid())
  RETURNING id INTO _movement_id;
  RETURN _movement_id;
END $$;
REVOKE ALL ON FUNCTION public.record_feed_stock_purchase(uuid, text, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_feed_stock_purchase(uuid, text, numeric, numeric, text) TO authenticated;

-- Farm customer directory. Sales retain buyer snapshots so old invoices remain readable.
CREATE TABLE public.farm_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name text NOT NULL,
  customer_type text NOT NULL DEFAULT 'individual' CHECK (customer_type IN ('individual', 'group', 'company')),
  phone text NOT NULL,
  email text,
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX farm_customers_farm_name_idx ON public.farm_customers(farm_id, lower(name));
ALTER TABLE public.farm_customers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_customers TO authenticated;
CREATE POLICY "Farm managers read customers" ON public.farm_customers FOR SELECT TO authenticated
  USING (public.can_manage_farm_sales(farm_id));
CREATE POLICY "Farm managers manage customers" ON public.farm_customers FOR ALL TO authenticated
  USING (public.can_manage_farm_sales(farm_id)) WITH CHECK (public.can_manage_farm_sales(farm_id));
CREATE TRIGGER trg_farm_customers_updated BEFORE UPDATE ON public.farm_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.sales_records
  ADD COLUMN customer_id uuid REFERENCES public.farm_customers(id) ON DELETE SET NULL,
  ADD COLUMN hatchery_production_id uuid REFERENCES public.hatchery_production(id) ON DELETE RESTRICT,
  ADD COLUMN fry_quantity integer,
  ADD CONSTRAINT sales_records_hatchery_quantity_check CHECK (
    (hatchery_production_id IS NULL AND COALESCE(fry_quantity, 0) = 0)
    OR (hatchery_production_id IS NOT NULL AND fry_quantity > 0)
  );
CREATE INDEX sales_records_customer_idx ON public.sales_records(customer_id);
CREATE INDEX sales_records_hatchery_idx ON public.sales_records(hatchery_production_id);

CREATE OR REPLACE FUNCTION public.guard_sales_customer_farm()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.farm_customers c WHERE c.id = NEW.customer_id AND c.farm_id = NEW.farm_id
  ) THEN
    RAISE EXCEPTION 'Customer must belong to the sale farm';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_sales_customer_farm BEFORE INSERT OR UPDATE ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION public.guard_sales_customer_farm();

CREATE OR REPLACE FUNCTION public.sync_sale_fry_inventory()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _source public.hatchery_production%ROWTYPE;
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF OLD.hatchery_production_id IS NOT NULL THEN
      UPDATE public.hatchery_production
        SET sales_sold_amount = GREATEST(0, sales_sold_amount - COALESCE(OLD.fry_quantity, 0))
        WHERE id = OLD.hatchery_production_id;
    END IF;
  END IF;
  IF TG_OP <> 'DELETE' AND NEW.hatchery_production_id IS NOT NULL THEN
    SELECT * INTO _source FROM public.hatchery_production
      WHERE id = NEW.hatchery_production_id AND farm_id = NEW.farm_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Hatchery batch does not belong to the sale farm'; END IF;
    IF NEW.fry_quantity IS NULL OR NEW.fry_quantity <= 0 OR NEW.fry_quantity > (_source.restocked_amount - _source.transferred_amount) THEN
      RAISE EXCEPTION 'Sale quantity exceeds fry available in this hatchery batch';
    END IF;
    UPDATE public.hatchery_production SET sales_sold_amount = sales_sold_amount + NEW.fry_quantity
      WHERE id = NEW.hatchery_production_id;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_sync_sale_fry_inventory_insert AFTER INSERT ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION public.sync_sale_fry_inventory();
CREATE TRIGGER trg_sync_sale_fry_inventory_update AFTER UPDATE ON public.sales_records
  FOR EACH ROW WHEN (OLD.hatchery_production_id IS DISTINCT FROM NEW.hatchery_production_id OR OLD.fry_quantity IS DISTINCT FROM NEW.fry_quantity)
  EXECUTE FUNCTION public.sync_sale_fry_inventory();
CREATE TRIGGER trg_sync_sale_fry_inventory_delete AFTER DELETE ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION public.sync_sale_fry_inventory();

-- New sales automatically appear in the farm ledger as income. Historical rows are not backfilled.
ALTER TABLE public.financial_records
  ADD COLUMN source_sale_id uuid UNIQUE REFERENCES public.sales_records(id) ON DELETE CASCADE;
CREATE OR REPLACE FUNCTION public.sync_sale_to_financial_ledger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.financial_records WHERE source_sale_id = OLD.id;
    RETURN OLD;
  END IF;
  IF NEW.total_amount > 0 AND NEW.farm_id IS NOT NULL THEN
    INSERT INTO public.financial_records (farm_id, record_type, category, description, amount, transaction_date, source_sale_id)
    VALUES (NEW.farm_id, 'revenue', CASE WHEN NEW.hatchery_production_id IS NOT NULL THEN 'fingerling_sales' ELSE 'fish_sales' END,
      'Sale: ' || NEW.buyer_name || COALESCE(' · ' || NEW.quantity, ''), NEW.total_amount, NEW.sale_date, NEW.id)
    ON CONFLICT (source_sale_id) DO UPDATE SET
      farm_id = EXCLUDED.farm_id, category = EXCLUDED.category, description = EXCLUDED.description,
      amount = EXCLUDED.amount, transaction_date = EXCLUDED.transaction_date;
  ELSE
    DELETE FROM public.financial_records WHERE source_sale_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_sync_sale_to_financial_ledger_insert AFTER INSERT ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION public.sync_sale_to_financial_ledger();
CREATE TRIGGER trg_sync_sale_to_financial_ledger_update AFTER UPDATE ON public.sales_records
  FOR EACH ROW WHEN (OLD.total_amount IS DISTINCT FROM NEW.total_amount OR OLD.sale_date IS DISTINCT FROM NEW.sale_date OR OLD.buyer_name IS DISTINCT FROM NEW.buyer_name OR OLD.quantity IS DISTINCT FROM NEW.quantity OR OLD.hatchery_production_id IS DISTINCT FROM NEW.hatchery_production_id)
  EXECUTE FUNCTION public.sync_sale_to_financial_ledger();
CREATE TRIGGER trg_sync_sale_to_financial_ledger_delete AFTER DELETE ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION public.sync_sale_to_financial_ledger();

-- Activity logs complement financial_records, which remain the source of expense totals.
CREATE TABLE public.farm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  description text,
  staff_name text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX farm_activities_farm_date_idx ON public.farm_activities(farm_id, activity_date DESC);
ALTER TABLE public.farm_activities ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_activities TO authenticated;
CREATE POLICY "Farm members read activities" ON public.farm_activities FOR SELECT TO authenticated
  USING (public.is_farm_member(farm_id));
CREATE POLICY "Farm members record activities" ON public.farm_activities FOR INSERT TO authenticated
  WITH CHECK (public.is_farm_member(farm_id) AND (recorded_by IS NULL OR recorded_by = auth.uid()));
CREATE POLICY "Farm managers update activities" ON public.farm_activities FOR UPDATE TO authenticated
  USING (public.can_manage_farm_sales(farm_id)) WITH CHECK (public.can_manage_farm_sales(farm_id));
CREATE POLICY "Farm managers delete activities" ON public.farm_activities FOR DELETE TO authenticated
  USING (public.can_manage_farm_sales(farm_id));
CREATE TRIGGER trg_farm_activities_updated BEFORE UPDATE ON public.farm_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Keep hatchery fry traceable when it moves into a grow-out batch.
ALTER TABLE public.hatchery_production
  ADD COLUMN transferred_amount integer NOT NULL DEFAULT 0 CHECK (transferred_amount >= 0),
  ADD COLUMN sales_sold_amount integer NOT NULL DEFAULT 0 CHECK (sales_sold_amount >= 0);
ALTER TABLE public.fish_batches
  ADD COLUMN source_hatchery_production_id uuid REFERENCES public.hatchery_production(id) ON DELETE RESTRICT;
CREATE INDEX fish_batches_hatchery_source_idx ON public.fish_batches(source_hatchery_production_id);

CREATE OR REPLACE FUNCTION public.guard_growout_pond_capacity()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _capacity integer; _pond_status text; _purpose text; _occupied integer; _conflict boolean;
BEGIN
  IF NEW.status = 'harvested' OR NEW.pond IS NULL OR trim(NEW.pond) = '' THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.farm_id::text || ':' || upper(trim(NEW.pond)), 0));
  SELECT capacity, status, purpose INTO _capacity, _pond_status, _purpose FROM public.hatchery_ponds
    WHERE farm_id = NEW.farm_id AND upper(name) = upper(trim(NEW.pond));
  IF _pond_status IS NOT NULL AND lower(_pond_status) <> 'active' THEN RAISE EXCEPTION 'Pond % is not active', trim(NEW.pond); END IF;
  IF _purpose IS NOT NULL AND _purpose <> 'grow_out' THEN RAISE EXCEPTION 'Choose a pond configured for grow-out'; END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.hatchery_production p WHERE p.farm_id = NEW.farm_id
      AND upper(p.pond_stocked) = upper(trim(NEW.pond)) AND p.status <> 'sold'
    UNION ALL
    SELECT 1 FROM public.brooders b WHERE b.farm_id = NEW.farm_id
      AND upper(b.pond_name) = upper(trim(NEW.pond)) AND b.health_status = 'active'
  ) INTO _conflict;
  IF _conflict THEN RAISE EXCEPTION 'Pond % is occupied by active hatchery stock', trim(NEW.pond); END IF;
  IF _capacity IS NOT NULL AND _capacity > 0 THEN
    SELECT COALESCE(sum(current_count), 0) INTO _occupied FROM public.fish_batches
      WHERE farm_id = NEW.farm_id AND upper(pond) = upper(trim(NEW.pond))
        AND status <> 'harvested' AND id IS DISTINCT FROM NEW.id;
    IF _occupied + COALESCE(NEW.current_count, 0) > _capacity THEN
      RAISE EXCEPTION 'Batch would exceed the capacity of pond %', trim(NEW.pond);
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_growout_pond_capacity BEFORE INSERT OR UPDATE ON public.fish_batches
  FOR EACH ROW EXECUTE FUNCTION public.guard_growout_pond_capacity();

CREATE OR REPLACE FUNCTION public.derive_hatchery_production()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.pond_stocked := upper(trim(NEW.pond_stocked));
  NEW.batch_code := upper(trim(NEW.batch_code));
  IF NEW.grading_date IS NULL AND NEW.collected_date IS NOT NULL THEN
    NEW.grading_date := NEW.collected_date + 25;
  END IF;
  IF COALESCE(NEW.total_collection,0) > 0 THEN
    NEW.survival_rate := ROUND((COALESCE(NEW.total_graded,0)::numeric / NEW.total_collection) * 100, 1);
  ELSE NEW.survival_rate := 0; END IF;
  NEW.restocked_amount := GREATEST(0, COALESCE(NEW.total_graded,0) - COALESCE(NEW.sold_amount,0) - COALESCE(NEW.sales_sold_amount,0));
  IF COALESCE(NEW.transferred_amount,0) > NEW.restocked_amount THEN
    RAISE EXCEPTION 'Transferred fry cannot exceed the remaining restocked fry';
  END IF;
  IF NEW.brooder_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.brooders b WHERE b.id = NEW.brooder_id AND b.farm_id = NEW.farm_id
  ) THEN
    RAISE EXCEPTION 'Brooder group must belong to this farm';
  END IF;
  IF COALESCE(NEW.total_graded,0) = 0 THEN NEW.status := 'stocked';
  ELSIF NEW.restocked_amount > 0 THEN NEW.status := 'restocked';
  ELSE NEW.status := 'sold'; END IF;
  RETURN NEW;
END $$;

-- Brooder groups and live fry batches share one physical pond space.
CREATE OR REPLACE FUNCTION public.guard_hatchery_pond_occupancy()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _pond text; _active boolean; _conflict boolean; _capacity integer; _fish_count integer; _pond_status text;
BEGIN
  IF TG_TABLE_NAME = 'brooders' THEN
    _pond := upper(trim(NEW.pond_name));
    _active := NEW.health_status = 'active';
    _fish_count := NEW.quantity;
  ELSE
    _pond := upper(trim(NEW.pond_stocked));
    _active := NEW.status <> 'sold';
    _fish_count := CASE WHEN COALESCE(NEW.total_graded, 0) > 0
      THEN GREATEST(COALESCE(NEW.total_graded, 0) - COALESCE(NEW.sold_amount, 0) - COALESCE(NEW.sales_sold_amount, 0) - COALESCE(NEW.transferred_amount, 0), 0)
      ELSE GREATEST(COALESCE(NEW.total_collection, 0), 0) END;
  END IF;
  IF NOT _active THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.farm_id::text || ':' || _pond, 0));
  SELECT capacity, status INTO _capacity, _pond_status FROM public.hatchery_ponds
    WHERE farm_id = NEW.farm_id AND upper(name) = _pond;
  IF _pond_status IS NOT NULL AND lower(_pond_status) <> 'active' THEN
    RAISE EXCEPTION 'Pond % is not active', _pond;
  END IF;
  IF _capacity IS NOT NULL AND _capacity > 0 AND _fish_count > _capacity THEN
    RAISE EXCEPTION 'Stock quantity exceeds the capacity of pond %', _pond;
  END IF;
  IF TG_TABLE_NAME = 'brooders' THEN
    SELECT EXISTS (SELECT 1 FROM public.hatchery_production p WHERE p.farm_id = NEW.farm_id
      AND upper(p.pond_stocked) = _pond AND p.status <> 'sold') INTO _conflict;
  ELSE
    SELECT EXISTS (SELECT 1 FROM public.brooders b WHERE b.farm_id = NEW.farm_id
      AND upper(b.pond_name) = _pond AND b.health_status = 'active') INTO _conflict;
  END IF;
  IF NOT _conflict THEN
    SELECT EXISTS (SELECT 1 FROM public.fish_batches fb WHERE fb.farm_id = NEW.farm_id
      AND upper(fb.pond) = _pond AND fb.status <> 'harvested') INTO _conflict;
  END IF;
  IF _conflict THEN RAISE EXCEPTION 'Pond is already occupied by active hatchery stock'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_brooder_pond BEFORE INSERT OR UPDATE ON public.brooders
  FOR EACH ROW EXECUTE FUNCTION public.guard_hatchery_pond_occupancy();
CREATE TRIGGER trg_guard_fry_pond BEFORE INSERT OR UPDATE ON public.hatchery_production
  FOR EACH ROW EXECUTE FUNCTION public.guard_hatchery_pond_occupancy();

CREATE OR REPLACE FUNCTION public.transfer_hatchery_fry_to_batch(
  _production_id uuid, _batch_name text, _pond text, _quantity integer, _stock_date date DEFAULT CURRENT_DATE
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _source public.hatchery_production%ROWTYPE; _species text; _new_batch_id uuid; _pond_capacity integer; _existing_count integer; _pond_status text; _pond_purpose text;
BEGIN
  SELECT * INTO _source FROM public.hatchery_production WHERE id = _production_id FOR UPDATE;
  IF NOT FOUND OR NOT public.is_farm_member(_source.farm_id) THEN
    RAISE EXCEPTION 'Hatchery batch not found for this farm';
  END IF;
  IF _quantity IS NULL OR _quantity <= 0 OR _quantity > (_source.restocked_amount - _source.transferred_amount) THEN
    RAISE EXCEPTION 'Transfer quantity exceeds available fry';
  END IF;
  IF NULLIF(trim(_batch_name), '') IS NULL OR NULLIF(trim(_pond), '') IS NULL THEN
    RAISE EXCEPTION 'Batch name and pond are required';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_source.farm_id::text || ':' || upper(trim(_pond)), 0));
  SELECT capacity, status, purpose INTO _pond_capacity, _pond_status, _pond_purpose FROM public.hatchery_ponds
    WHERE farm_id = _source.farm_id AND upper(name) = upper(trim(_pond));
  IF _pond_status IS NOT NULL AND lower(_pond_status) <> 'active' THEN
    RAISE EXCEPTION 'Destination pond % is not active', trim(_pond);
  END IF;
  IF _pond_purpose IS NOT NULL AND _pond_purpose <> 'grow_out' THEN
    RAISE EXCEPTION 'Choose a pond configured for grow-out';
  END IF;
  IF _pond_capacity IS NOT NULL AND _pond_capacity > 0 THEN
    SELECT COALESCE(sum(current_count), 0) INTO _existing_count FROM public.fish_batches
      WHERE farm_id = _source.farm_id AND upper(pond) = upper(trim(_pond)) AND status <> 'harvested';
    IF _existing_count + _quantity > _pond_capacity THEN
      RAISE EXCEPTION 'Transfer would exceed the capacity of pond %', trim(_pond);
    END IF;
  END IF;
  SELECT species INTO _species FROM public.brooders WHERE id = _source.brooder_id;
  UPDATE public.hatchery_production SET transferred_amount = transferred_amount + _quantity WHERE id = _production_id;
  INSERT INTO public.fish_batches (
    farm_id, name, species, stage, pond, stock_date, initial_count, current_count,
    status, source_hatchery_production_id
  ) VALUES (
    _source.farm_id, trim(_batch_name), COALESCE(_species, 'Nile Tilapia'), 'fingerling',
    trim(_pond), COALESCE(_stock_date, CURRENT_DATE), _quantity, _quantity,
    'stocked', _production_id
  ) RETURNING id INTO _new_batch_id;
  RETURN _new_batch_id;
END $$;
GRANT EXECUTE ON FUNCTION public.transfer_hatchery_fry_to_batch(uuid, text, text, integer, date) TO authenticated;
REVOKE ALL ON FUNCTION public.transfer_hatchery_fry_to_batch(uuid, text, text, integer, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_hatchery_fry_to_batch(uuid, text, text, integer, date) TO authenticated;
