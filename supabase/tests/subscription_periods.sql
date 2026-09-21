-- Verifies migration 20260917100100_subscription_periods.sql (effective_plan +
-- expire_lapsed_subscriptions). Run on a STAGING copy in the SQL editor; ends with
-- ROLLBACK. Not executed in the authoring environment (no Postgres available).

BEGIN;

DO $$
DECLARE
  u_running uuid := '00000000-0000-0000-0000-00000000c001';
  u_lapsed  uuid := '00000000-0000-0000-0000-00000000c002';
  u_grant   uuid := '00000000-0000-0000-0000-00000000c003';
  u_none    uuid := '00000000-0000-0000-0000-00000000c004';
  n int;
BEGIN
  INSERT INTO auth.users (id, email) VALUES
    (u_running, 'c1@test.local'), (u_lapsed, 'c2@test.local'), (u_grant, 'c3@test.local'), (u_none, 'c4@test.local')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscribers_cache (user_id, plan, subscribed, current_period_start, current_period_end) VALUES
    (u_running, 'pro',        true, now() - interval '5 days', now() + interval '25 days'),
    (u_lapsed,  'enterprise', true, now() - interval '40 days', now() - interval '10 days'),
    (u_grant,   'pro',        true, NULL, NULL)
  ON CONFLICT (user_id) DO UPDATE SET plan = EXCLUDED.plan, subscribed = EXCLUDED.subscribed,
    current_period_start = EXCLUDED.current_period_start, current_period_end = EXCLUDED.current_period_end;

  IF public.effective_plan(u_running) <> 'pro'   THEN RAISE EXCEPTION 'FAIL: a running pro plan must stay pro'; END IF;
  IF public.effective_plan(u_lapsed)  <> 'free'  THEN RAISE EXCEPTION 'FAIL: a lapsed enterprise plan must read as free (Basic)'; END IF;
  IF public.effective_plan(u_grant)   <> 'pro'   THEN RAISE EXCEPTION 'FAIL: an admin grant (no end date) must never expire'; END IF;
  IF public.effective_plan(u_none)    <> 'free'  THEN RAISE EXCEPTION 'FAIL: a user with no row must read as free (Basic)'; END IF;

  -- housekeeping moves ONLY lapsed paid rows
  SELECT public.expire_lapsed_subscriptions() INTO n;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: expire_lapsed_subscriptions should change exactly 1 row, changed %', n; END IF;
  IF (SELECT plan FROM public.subscribers_cache WHERE user_id = u_lapsed) <> 'free' THEN RAISE EXCEPTION 'FAIL: lapsed row not reset'; END IF;
  IF (SELECT subscribed FROM public.subscribers_cache WHERE user_id = u_lapsed) THEN RAISE EXCEPTION 'FAIL: lapsed row still subscribed'; END IF;
  IF (SELECT plan FROM public.subscribers_cache WHERE user_id = u_running) <> 'pro' THEN RAISE EXCEPTION 'FAIL: housekeeping touched a running plan'; END IF;
  IF (SELECT plan FROM public.subscribers_cache WHERE user_id = u_grant) <> 'pro' THEN RAISE EXCEPTION 'FAIL: housekeeping touched an admin grant'; END IF;

  -- idempotent
  SELECT public.expire_lapsed_subscriptions() INTO n;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: second run should change nothing, changed %', n; END IF;

  RAISE NOTICE 'subscription periods: ALL CHECKS PASSED';
END $$;

ROLLBACK;
