import { useEffect, useState } from "react";
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

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!active) return;
        setRoles((data ?? []).map((r: any) => r.role as AppRole));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

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
