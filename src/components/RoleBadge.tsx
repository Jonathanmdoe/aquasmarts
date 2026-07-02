import { useUserRole } from "@/hooks/useUserRole";
import { Shield, Crown, UserCog, HardHat, User } from "lucide-react";

const ROLE_META: Record<string, { label: string; icon: any; cls: string }> = {
  super_admin: { label: "Admin", icon: Shield, cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  owner: { label: "Owner", icon: Crown, cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  manager: { label: "Manager", icon: UserCog, cls: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  worker: { label: "Worker", icon: HardHat, cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
};

export default function RoleBadge() {
  const { primaryRole, loading } = useUserRole();
  if (loading) return null;
  const meta = primaryRole ? ROLE_META[primaryRole] : null;
  const Icon = meta?.icon ?? User;
  return (
    <div
      data-testid="role-badge"
      className={`fixed top-2 right-2 z-50 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md shadow-sm border border-border/50 ${meta?.cls ?? "bg-muted text-muted-foreground"}`}
    >
      <Icon className="w-3 h-3" />
      {meta?.label ?? "No role"}
    </div>
  );
}
