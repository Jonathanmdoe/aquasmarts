// Pure authorization helpers for edge functions that must not be callable with
// only the public anon key. No Deno/Node APIs so it is unit-testable under Node.

/** Extracts the token from `Authorization: Bearer <token>`, or null. */
export function bearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return m ? m[1] : null;
}

export interface FarmRow {
  id: string;
  user_id: string;
}
export interface MembershipRow {
  role: string;
  is_active: boolean;
}

export type AccessDecision =
  | { allowed: true; via: "owner" | "manager" }
  | { allowed: false; status: 400 | 403; reason: string };

// Roles that may use farm financial tooling. Workers may not.
const FINANCE_ROLES = new Set(["owner", "manager"]);

/**
 * Decides whether [userId] may use financial tooling for [farmId].
 *
 * Allowed: the farm's owner, or an ACTIVE team member whose role is owner/manager.
 * Everything else — no farm id, unknown farm, someone else's farm, a worker, a
 * deactivated member — is refused. An unknown farm and a foreign farm give the
 * same 403 so the caller cannot probe which farm ids exist.
 */
export function decideFarmFinanceAccess(input: {
  userId: string;
  farmId: unknown;
  farm: FarmRow | null;
  membership: MembershipRow | null;
}): AccessDecision {
  const { userId, farmId, farm, membership } = input;
  if (typeof farmId !== "string" || farmId.trim() === "") {
    return { allowed: false, status: 400, reason: "farm_id is required" };
  }
  if (!farm || farm.id !== farmId) {
    return { allowed: false, status: 403, reason: "Not allowed for this farm" };
  }
  if (farm.user_id === userId) return { allowed: true, via: "owner" };
  if (membership && membership.is_active && FINANCE_ROLES.has(membership.role)) {
    return { allowed: true, via: "manager" };
  }
  return { allowed: false, status: 403, reason: "Not allowed for this farm" };
}

export const FINANCE_AI_MODES = [
  "full_analysis",
  "pnl_analysis",
  "cost_reduction",
  "cash_flow",
  "budget",
  "tax",
  "debt",
  "question",
] as const;

export const MAX_BODY_BYTES = 200_000;
