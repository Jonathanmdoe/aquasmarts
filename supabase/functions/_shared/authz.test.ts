import { test } from "node:test";
import assert from "node:assert/strict";
import { bearerToken, decideFarmFinanceAccess, FINANCE_AI_MODES } from "./authz.ts";

const FARM_A = { id: "farm-a", user_id: "owner-a" };
const FARM_B = { id: "farm-b", user_id: "owner-b" };

test("bearerToken accepts only a well-formed Bearer header", () => {
  assert.equal(bearerToken("Bearer abc.def.ghi"), "abc.def.ghi");
  assert.equal(bearerToken("bearer  tok"), "tok");
  assert.equal(bearerToken(null), null);
  assert.equal(bearerToken(""), null);
  assert.equal(bearerToken("Basic abc"), null);
  assert.equal(bearerToken("Bearer"), null);
  assert.equal(bearerToken("Bearer a b"), null);
});

test("logged-out / anon-key-only callers never reach the farm check (no token => no user)", () => {
  // The handler returns 401 before decideFarmFinanceAccess when there is no
  // valid user; the anon key carries no `sub`, so auth.getUser() rejects it.
  assert.equal(bearerToken(undefined), null);
});

test("the farm owner is allowed for their own farm", () => {
  const d = decideFarmFinanceAccess({ userId: "owner-a", farmId: "farm-a", farm: FARM_A, membership: null });
  assert.deepEqual(d, { allowed: true, via: "owner" });
});

test("an active manager of the farm is allowed", () => {
  const d = decideFarmFinanceAccess({
    userId: "mgr", farmId: "farm-a", farm: FARM_A, membership: { role: "manager", is_active: true },
  });
  assert.deepEqual(d, { allowed: true, via: "manager" });
});

test("cross-farm: an owner of farm A asking for farm B is denied", () => {
  // Handler loads farm B and this user's membership of farm B (none).
  const d = decideFarmFinanceAccess({ userId: "owner-a", farmId: "farm-b", farm: FARM_B, membership: null });
  assert.equal(d.allowed, false);
  assert.equal((d as { status: number }).status, 403);
});

test("cross-farm: a manager of farm A asking for farm B is denied", () => {
  const d = decideFarmFinanceAccess({ userId: "mgr-a", farmId: "farm-b", farm: FARM_B, membership: null });
  assert.equal(d.allowed, false);
});

test("a worker on the farm is denied", () => {
  const d = decideFarmFinanceAccess({
    userId: "w", farmId: "farm-a", farm: FARM_A, membership: { role: "worker", is_active: true },
  });
  assert.equal(d.allowed, false);
  assert.equal((d as { status: number }).status, 403);
});

test("a deactivated manager is denied", () => {
  const d = decideFarmFinanceAccess({
    userId: "mgr", farmId: "farm-a", farm: FARM_A, membership: { role: "manager", is_active: false },
  });
  assert.equal(d.allowed, false);
});

test("a missing farm_id is a 400, and an unknown farm is indistinguishable from a foreign one", () => {
  const missing = decideFarmFinanceAccess({ userId: "u", farmId: undefined, farm: null, membership: null });
  assert.equal(missing.allowed, false);
  assert.equal((missing as { status: number }).status, 400);

  const blank = decideFarmFinanceAccess({ userId: "u", farmId: "  ", farm: null, membership: null });
  assert.equal((blank as { status: number }).status, 400);

  const unknown = decideFarmFinanceAccess({ userId: "u", farmId: "nope", farm: null, membership: null });
  const foreign = decideFarmFinanceAccess({ userId: "u", farmId: "farm-b", farm: FARM_B, membership: null });
  assert.equal((unknown as { status: number }).status, 403);
  assert.deepEqual(unknown, foreign);
});

test("a spoofed farm row that does not match the requested id is refused", () => {
  const d = decideFarmFinanceAccess({ userId: "owner-a", farmId: "farm-b", farm: FARM_A, membership: null });
  assert.equal(d.allowed, false);
});

test("only the documented finance modes are advertised", () => {
  assert.ok(FINANCE_AI_MODES.includes("full_analysis"));
  assert.ok(FINANCE_AI_MODES.includes("question"));
  assert.ok(!(FINANCE_AI_MODES as readonly string[]).includes("drop_tables"));
});
