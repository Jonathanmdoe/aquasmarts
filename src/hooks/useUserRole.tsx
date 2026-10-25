import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole =
  | "owner"
  | "manager"
  | "worker"
  | "super_admin"
  | "moderator"
  | "support_agent";

// Precedence: super_admin > owner > manager > worker
const PRECEDENCE: AppRole[] = [
  "super_admin",
  "owner",
  "manager",
  "moderator",
  "support_agent",
  "worker",
];

const cacheKey = (userId: string) => `aquasmart.roles.${userId}`;

// localStorage (not sessionStorage) so the cache survives the Android app being
// closed: relaunch shows the right home instantly, even offline.
function readCache(userId: string): AppRole[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    return raw ? (JSON.parse(raw) as AppRole[]) : null;
  } catch {
    return null;
  }
}

type RoleState = { roles: AppRole[]; loading: boolean };

const RoleContext = createContext<RoleState | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<RoleState>({ roles: [], loading: true });
  // Keyed on the id, not the user object: on startup Supabase reports the restored
  // session twice (onAuthStateChange + getSession) as different objects, and
  // re-running on that used to discard the in-flight fetch and spin forever.
  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setState({ roles: [], loading: false });
      return;
    }

    // Instant hydration from cache so navigation never flashes the wrong UI.
    const cached = readCache(userId);
    setState(cached ? { roles: cached, loading: false } : { roles: [], loading: true });

    let active = true;
    const done = (roles: AppRole[] | null) => {
      if (!active) return;
      // On failure keep whatever we had rather than spinning forever.
      setState({ roles: roles ?? cached ?? [], loading: false });
    };
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(
        ({ data, error }) => {
          if (error) return done(null);
          const roles = (data ?? []).map((r: any) => r.role as AppRole);
          try {
            localStorage.setItem(cacheKey(userId), JSON.stringify(roles));
          } catch {
            /* ignore */
          }
          done(roles);
        },
        () => done(null),
      );

    return () => {
      active = false;
    };
  }, [userId, authLoading]);

  return <RoleContext.Provider value={state}>{children}</RoleContext.Provider>;
}

export function useUserRole() {
  const ctx = useContext(RoleContext);
  const state = ctx ?? { roles: [], loading: true };
  const { roles, loading } = state;

  const primaryRole: AppRole | null =
    PRECEDENCE.find((r) => roles.includes(r)) ?? null;

  return {
    roles,
    primaryRole,
    isSuperAdmin: roles.includes("super_admin"),
    isOwner: roles.includes("owner"),
    isManager: roles.includes("manager"),
    isWorker: roles.includes("worker"),
    isModerator: roles.includes("moderator"),
    isSupportAgent: roles.includes("support_agent"),
    loading,
  };
}
