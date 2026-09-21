import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addOneMonth,
  checkoutUnitAmount,
  computePeriod,
  resolveCheckoutPlan,
  LEGACY_PRICE_ID_TO_PLAN,
} from "./subscription.ts";

const d = (s: string) => new Date(s);

test("addOneMonth is a calendar month, not 30 days", () => {
  assert.equal(addOneMonth(d("2026-09-16T10:00:00Z")).toISOString(), "2026-10-16T10:00:00.000Z");
  assert.equal(addOneMonth(d("2026-01-31T00:00:00Z")).toISOString(), "2026-02-28T00:00:00.000Z"); // clamped
  assert.equal(addOneMonth(d("2028-01-31T00:00:00Z")).toISOString(), "2028-02-29T00:00:00.000Z"); // leap year
  assert.equal(addOneMonth(d("2026-12-15T08:30:00Z")).toISOString(), "2027-01-15T08:30:00.000Z"); // year roll
  assert.equal(addOneMonth(d("2026-03-31T00:00:00Z")).toISOString(), "2026-04-30T00:00:00.000Z");
});

test("first purchase starts now and ends one month later", () => {
  const now = d("2026-09-16T10:00:00Z");
  const p = computePeriod(null, "pro", now);
  assert.equal(p.start.toISOString(), now.toISOString());
  assert.equal(p.end.toISOString(), "2026-10-16T10:00:00.000Z");
});

test("renewing the same active plan continues from the current end (no lost days)", () => {
  const now = d("2026-09-16T10:00:00Z");
  const p = computePeriod({ plan: "pro", current_period_end: "2026-09-25T00:00:00Z" }, "pro", now);
  assert.equal(p.start.toISOString(), "2026-09-25T00:00:00.000Z");
  assert.equal(p.end.toISOString(), "2026-10-25T00:00:00.000Z");
});

test("a lapsed plan restarts from now", () => {
  const now = d("2026-09-16T10:00:00Z");
  const p = computePeriod({ plan: "pro", current_period_end: "2026-08-01T00:00:00Z" }, "pro", now);
  assert.equal(p.start.toISOString(), now.toISOString());
});

test("changing plan starts now even if the old plan is still active", () => {
  const now = d("2026-09-16T10:00:00Z");
  const p = computePeriod({ plan: "pro", current_period_end: "2026-09-25T00:00:00Z" }, "enterprise", now);
  assert.equal(p.start.toISOString(), now.toISOString());
  assert.equal(p.end.toISOString(), "2026-10-16T10:00:00.000Z");
});

test("a missing or garbage end date is treated as not active", () => {
  const now = d("2026-09-16T10:00:00Z");
  assert.equal(computePeriod({ plan: "pro", current_period_end: null }, "pro", now).start.toISOString(), now.toISOString());
  assert.equal(computePeriod({ plan: "pro", current_period_end: "not-a-date" }, "pro", now).start.toISOString(), now.toISOString());
});

test("checkout plan resolves from the new `plan` field or a legacy price id — never from anything else", () => {
  assert.equal(resolveCheckoutPlan({ plan: "pro" }), "pro");
  assert.equal(resolveCheckoutPlan({ plan: " Enterprise " }), "enterprise");
  assert.equal(resolveCheckoutPlan({ plan: "basic" }), null); // Basic has no Stripe product
  assert.equal(resolveCheckoutPlan({ plan: "free" }), null);
  for (const [priceId, plan] of Object.entries(LEGACY_PRICE_ID_TO_PLAN)) {
    assert.equal(resolveCheckoutPlan({ priceId }), plan);
  }
  assert.equal(resolveCheckoutPlan({ priceId: "price_unknown" }), null);
  assert.equal(resolveCheckoutPlan({}), null);
});

test("the charged amount is the Admin price (TZS x 100) — a client cannot influence it", () => {
  const settings = { price_pro_cents: 7900000, price_enterprise_cents: "25900000", price_basic_cents: 0 };
  assert.equal(checkoutUnitAmount(settings, "pro"), 7900000); // TZS 79,000
  assert.equal(checkoutUnitAmount(settings, "enterprise"), 25900000); // TZS 259,000
  // an Admin price change flows straight through
  assert.equal(checkoutUnitAmount({ price_pro_cents: 9900000 }, "pro"), 9900000);
});

test("a missing, zero, negative or non-numeric price refuses checkout rather than charging something", () => {
  assert.equal(checkoutUnitAmount(null, "pro"), null);
  assert.equal(checkoutUnitAmount({}, "pro"), null);
  assert.equal(checkoutUnitAmount({ price_pro_cents: 0 }, "pro"), null);
  assert.equal(checkoutUnitAmount({ price_pro_cents: -5 }, "pro"), null);
  assert.equal(checkoutUnitAmount({ price_pro_cents: "abc" }, "pro"), null);
  assert.equal(checkoutUnitAmount({ price_pro_cents: NaN }, "pro"), null);
});
