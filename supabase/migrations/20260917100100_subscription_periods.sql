-- Paid subscriptions get a real period, so a monthly plan can EXPIRE.
--
-- Before: subscribers_cache had only (plan, subscribed): a mobile-money payment set
-- plan='pro', subscribed=true and nothing ever ended it.
-- After:  current_period_start / current_period_end record the paid term. NULL means
-- "no end" (an admin grant, or a legacy row that has not been re-purchased yet).
-- Expiry is evaluated on read (client gate + effective_plan()), so it takes effect even
-- if nothing runs; expire_lapsed_subscriptions() additionally tidies the stored row.

ALTER TABLE public.subscribers_cache
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- The plan a user is entitled to RIGHT NOW: a paid plan whose period has ended is
-- 'free' (shown to users as Basic). SECURITY INVOKER: RLS on subscribers_cache
-- already limits who can read whose row (self or super_admin).
CREATE OR REPLACE FUNCTION public.effective_plan(_user_id uuid)
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE((
    SELECT CASE
      WHEN sc.plan <> 'free' AND sc.current_period_end IS NOT NULL AND sc.current_period_end <= now() THEN 'free'
      ELSE sc.plan
    END
    FROM public.subscribers_cache sc
    WHERE sc.user_id = _user_id
  ), 'free');
$$;

-- Optional housekeeping (run by service_role / a scheduler, e.g. pg_cron daily):
-- moves lapsed rows back to the stored no-paid-plan marker. Correctness does NOT
-- depend on this running — reads already treat an ended period as expired.
CREATE OR REPLACE FUNCTION public.expire_lapsed_subscriptions()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  UPDATE public.subscribers_cache
     SET plan = 'free', subscribed = false, updated_at = now()
   WHERE plan <> 'free' AND current_period_end IS NOT NULL AND current_period_end <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.expire_lapsed_subscriptions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_lapsed_subscriptions() TO service_role;

-- Conservative backfill from existing confirmed mobile-money payments: give a still-
-- running subscription a proper period (last confirmed payment + 1 calendar month),
-- but ONLY when that period has not already ended. Nobody is expired by this migration.
WITH latest AS (
  SELECT DISTINCT ON (user_id) user_id, plan, COALESCE(reviewed_at, created_at) AS activated_at
  FROM public.payment_transactions
  WHERE purpose = 'subscription' AND status = 'paid' AND provider = 'mpesa_manual' AND plan IS NOT NULL
  ORDER BY user_id, COALESCE(reviewed_at, created_at) DESC
)
UPDATE public.subscribers_cache sc
   SET current_period_start = l.activated_at,
       current_period_end = l.activated_at + interval '1 month'
  FROM latest l
 WHERE sc.user_id = l.user_id
   AND sc.plan = l.plan
   AND sc.subscribed
   AND sc.current_period_end IS NULL
   AND l.activated_at + interval '1 month' > now();

-- Paid plans still WITHOUT an end date after the backfill (admin grants, or mobile-money
-- plans whose last payment is already over a month old) are left untouched rather than
-- expired by surprise. Review them, then either re-grant or let them renew:
--   SELECT sc.user_id, sc.plan, sc.updated_at, p.email
--   FROM public.subscribers_cache sc LEFT JOIN public.profiles p ON p.user_id = sc.user_id
--   WHERE sc.plan <> 'free' AND sc.current_period_end IS NULL;
