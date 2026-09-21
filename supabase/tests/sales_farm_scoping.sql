-- Verifies migration 20260917100000_sales_records_farm_scoping.sql.
--
-- HOW TO RUN: paste into the Supabase SQL editor of a STAGING copy (or any database
-- that has the project's migrations applied). It creates throw-away users/farms, runs
-- every check as the relevant user (RLS enforced), and ends with ROLLBACK — nothing
-- persists. Each failed check raises an exception naming the broken rule; a clean run
-- prints "sales farm scoping: ALL CHECKS PASSED".
--
-- Not executed as part of this change: no Postgres was available in the authoring
-- environment. Run it before applying the migration to production.

BEGIN;

DO $$
DECLARE
  owner_a  uuid := '00000000-0000-0000-0000-00000000a001';
  mgr_a    uuid := '00000000-0000-0000-0000-00000000a002';
  worker_a uuid := '00000000-0000-0000-0000-00000000a003';
  owner_b  uuid := '00000000-0000-0000-0000-00000000b001';
  farm_a   uuid := '00000000-0000-0000-0000-0000000fa001';
  farm_b   uuid := '00000000-0000-0000-0000-0000000fb001';
  n        int;
  raised   boolean;
BEGIN
  -- ---- fixtures (as the migration role) -----------------------------------------
  INSERT INTO auth.users (id, email) VALUES
    (owner_a, 'owner-a@test.local'), (mgr_a, 'mgr-a@test.local'),
    (worker_a, 'worker-a@test.local'), (owner_b, 'owner-b@test.local')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.farms (id, user_id, name) VALUES (farm_a, owner_a, 'Farm A'), (farm_b, owner_b, 'Farm B');
  INSERT INTO public.team_members (farm_id, user_id, role) VALUES (farm_a, mgr_a, 'manager'), (farm_a, worker_a, 'worker');

  -- a legacy, unmapped sale recorded by owner A (farm_id NULL)
  INSERT INTO public.sales_records (id, seller_id, farm_id, buyer_name, buyer_phone, quantity, total_amount)
  VALUES ('00000000-0000-0000-0000-00000005a001', owner_a, NULL, 'Legacy', '0700', '5', 500);

  -- ---- manager A records a sale on Farm A: allowed -------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', mgr_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  INSERT INTO public.sales_records (id, farm_id, seller_id, buyer_name, buyer_phone, quantity, total_amount)
  VALUES ('00000000-0000-0000-0000-00000005a002', farm_a, mgr_a, 'By manager', '0700', '10', 1000);

  -- manager cannot record on Farm B
  raised := false;
  BEGIN
    INSERT INTO public.sales_records (farm_id, seller_id, buyer_name, buyer_phone, quantity, total_amount)
    VALUES (farm_b, mgr_a, 'x', '0700', '1', 1);
  EXCEPTION WHEN others THEN raised := true; END;
  IF NOT raised THEN RAISE EXCEPTION 'FAIL: manager of A could insert a sale on Farm B'; END IF;

  -- manager cannot record as somebody else
  raised := false;
  BEGIN
    INSERT INTO public.sales_records (farm_id, seller_id, buyer_name, buyer_phone, quantity, total_amount)
    VALUES (farm_a, owner_a, 'x', '0700', '1', 1);
  EXCEPTION WHEN others THEN raised := true; END;
  IF NOT raised THEN RAISE EXCEPTION 'FAIL: manager could insert a sale attributed to another user'; END IF;

  -- manager cannot record without a farm
  raised := false;
  BEGIN
    INSERT INTO public.sales_records (farm_id, seller_id, buyer_name, buyer_phone, quantity, total_amount)
    VALUES (NULL, mgr_a, 'x', '0700', '1', 1);
  EXCEPTION WHEN others THEN raised := true; END;
  IF NOT raised THEN RAISE EXCEPTION 'FAIL: a new sale without a farm was accepted'; END IF;

  -- manager sees Farm A's sale, but not owner A's legacy unmapped row, and nothing of Farm B
  SELECT count(*) INTO n FROM public.sales_records;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: manager should see exactly 1 sale, saw %', n; END IF;

  -- manager cannot reassign who recorded the sale, nor move it to another farm
  raised := false;
  BEGIN UPDATE public.sales_records SET seller_id = owner_a WHERE id = '00000000-0000-0000-0000-00000005a002';
  EXCEPTION WHEN others THEN raised := true; END;
  IF NOT raised THEN RAISE EXCEPTION 'FAIL: seller_id was rewritable'; END IF;
  raised := false;
  BEGIN UPDATE public.sales_records SET farm_id = farm_b WHERE id = '00000000-0000-0000-0000-00000005a002';
  EXCEPTION WHEN others THEN raised := true; END;
  IF NOT raised THEN RAISE EXCEPTION 'FAIL: farm_id was rewritable once set'; END IF;

  -- manager can update the delivery status
  UPDATE public.sales_records SET delivery_status = 'delivered' WHERE id = '00000000-0000-0000-0000-00000005a002';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: manager could not update a farm sale'; END IF;
  EXECUTE 'RESET ROLE';

  -- ---- owner A sees the manager's sale AND their own legacy row -------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', owner_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO n FROM public.sales_records;
  IF n <> 2 THEN RAISE EXCEPTION 'FAIL: owner A should see 2 sales (manager''s + own legacy), saw %', n; END IF;
  SELECT count(*) INTO n FROM public.sales_records WHERE seller_id = mgr_a AND farm_id = farm_a;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: owner A cannot see the sale their manager recorded'; END IF;
  EXECUTE 'RESET ROLE';

  -- ---- worker A: no access to sales at all ---------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', worker_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO n FROM public.sales_records;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a worker saw % sales', n; END IF;
  EXECUTE 'RESET ROLE';

  -- ---- owner B (other farm): sees nothing of Farm A ------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', owner_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO n FROM public.sales_records;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: cross-farm leak — owner B saw % sales of Farm A', n; END IF;
  raised := false;
  BEGIN UPDATE public.sales_records SET delivery_status = 'pending' WHERE farm_id = farm_a;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN raised := true; END IF;
  EXCEPTION WHEN others THEN NULL; END;
  IF raised THEN RAISE EXCEPTION 'FAIL: owner B updated Farm A sales'; END IF;
  EXECUTE 'RESET ROLE';

  -- ---- a deactivated manager loses access ----------------------------------------
  UPDATE public.team_members SET is_active = false WHERE farm_id = farm_a AND user_id = mgr_a;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', mgr_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO n FROM public.sales_records;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a deactivated manager still saw % sales', n; END IF;
  EXECUTE 'RESET ROLE';

  RAISE NOTICE 'sales farm scoping: ALL CHECKS PASSED';
END $$;

ROLLBACK;
