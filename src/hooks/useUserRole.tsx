import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
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

function readCache(userId: string): AppRole[] | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(userId));
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
  const fetchedFor = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      fetchedFor.current = null;
      setState({ roles: [], loading: false });
      return;
    }

    // Instant hydration from cache so navigation never flashes the wrong UI.
    const cached = readCache(user.id);
    if (cached) setState({ roles: cached, loading: false });
    else setState((s) => ({ ...s, loading: true }));

    if (fetchedFor.current === user.id) return;
    fetchedFor.current = user.id;

    let active = true;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!active) return;
        const roles = (data ?? []).map((r: any) => r.role as AppRole);
        try {
          sessionStorage.setItem(cacheKey(user.id), JSON.stringify(roles));
        } catch {
          /* ignore */
        }
        setState({ roles, loading: false });
      });

    return () => {
      active = false;
    };
  }, [user, authLoading]);

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
