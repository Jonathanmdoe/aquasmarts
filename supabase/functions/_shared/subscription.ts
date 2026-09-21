// Pure subscription helpers shared by `create-checkout` and `manual-payment`.
// No Deno/Node APIs are used so the same file is unit-testable under Node
// (`node --test supabase/functions/_shared`).

export type PaidPlan = "pro" | "enterprise";
export type Plan = "basic" | PaidPlan;

// Existing Stripe *products* (used only to map a live Stripe subscription back to
// a tier in `check-subscription`). Prices are NOT stored here: the amount charged
// always comes from `platform_settings`, so nothing in code can disagree with Admin.
export const STRIPE_PRODUCT_BY_PLAN: Record<PaidPlan, string> = {
  pro: "prod_U1vczhh3nu9qex",
  enterprise: "prod_U1vd1S5APQaaOl",
};

// Older clients (the web app, earlier app builds) still send a Stripe price id.
// It is only used to work out WHICH plan they meant; the price id itself is never
// charged, so an old client can no longer bill the fixed USD price.
export const LEGACY_PRICE_ID_TO_PLAN: Record<string, PaidPlan> = {
  price_1T3rli5QBKHmumrVmhjCZjeP: "pro",
  price_1T3rm35QBKHmumrVVpM7NNrs: "enterprise",
};

export const PLAN_PRICE_COLUMN: Record<Plan, string> = {
  basic: "price_basic_cents",
  pro: "price_pro_cents",
  enterprise: "price_enterprise_cents",
};

/** Which paid plan a checkout request is for, or null if it names none we sell by card. */
export function resolveCheckoutPlan(body: { plan?: unknown; priceId?: unknown }): PaidPlan | null {
  const plan = typeof body.plan === "string" ? body.plan.trim().toLowerCase() : "";
  if (plan === "pro" || plan === "enterprise") return plan;
  const priceId = typeof body.priceId === "string" ? body.priceId.trim() : "";
  return LEGACY_PRICE_ID_TO_PLAN[priceId] ?? null;
}

/**
 * The Stripe `unit_amount` (minor units) for [plan], read from the Admin-set
 * `platform_settings` row. Those columns already store TZS x 100 — exactly the
 * minor-unit form of a two-decimal currency — so they are used as-is.
 * Returns null when the price is missing, non-numeric or not strictly positive.
 */
export function checkoutUnitAmount(settings: Record<string, unknown> | null | undefined, plan: PaidPlan): number | null {
  const raw = settings?.[PLAN_PRICE_COLUMN[plan]];
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return null;
  const amount = Math.round(n);
  return amount > 0 ? amount : null;
}

/**
 * Adds one calendar month in UTC, clamping to the last day of a shorter month
 * (31 Jan -> 28/29 Feb) — the same calendar-month semantics as Stripe's
 * `interval: month`, rather than a fixed 30 days.
 */
export function addOneMonth(from: Date): Date {
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();
  const targetMonthStart = Date.UTC(y, m + 1, 1);
  const target = new Date(targetMonthStart);
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const day = Math.min(from.getUTCDate(), lastDay);
  return new Date(
    Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      day,
      from.getUTCHours(),
      from.getUTCMinutes(),
      from.getUTCSeconds(),
      from.getUTCMilliseconds(),
    ),
  );
}

export interface ExistingSubscription {
  plan?: string | null;
  current_period_end?: string | null;
}

/**
 * The paid period a confirmed one-month payment for [plan] creates.
 *  - Renewing the SAME plan while it is still active continues from the current
 *    period end, so early renewal never loses days.
 *  - Anything else (first purchase, a lapsed plan, or a change of plan) starts now.
 */
export function computePeriod(
  existing: ExistingSubscription | null | undefined,
  plan: string,
  now: Date,
): { start: Date; end: Date } {
  const currentEnd = existing?.current_period_end ? new Date(existing.current_period_end) : null;
  const stillActive = currentEnd !== null && !Number.isNaN(currentEnd.getTime()) && currentEnd.getTime() > now.getTime();
  const start = existing?.plan === plan && stillActive ? currentEnd! : now;
  return { start, end: addOneMonth(start) };
}
