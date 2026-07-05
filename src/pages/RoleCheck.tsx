import { useNavigate } from "react-router-dom";
import { Check, X, Shield, Crown, UserCog, HardHat } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";

type RoleName = "owner" | "manager" | "worker" | "super_admin";

const PAGES: { path: string; label: string; allow: RoleName[] | "all" }[] = [
  { path: "/", label: "Dashboard (Home)", allow: ["owner", "manager", "super_admin"] },
  { path: "/worker", label: "Worker Dashboard", allow: "all" },
  { path: "/batches", label: "Batches", allow: ["owner", "manager", "worker", "super_admin"] },
  { path: "/feeding", label: "Feeding", allow: ["owner", "manager", "worker", "super_admin"] },
  { path: "/water", label: "Water Quality", allow: ["owner", "manager", "worker", "super_admin"] },
  { path: "/health", label: "Health", allow: ["owner", "manager", "worker", "super_admin"] },
  { path: "/financial", label: "Financial", allow: ["owner", "manager", "super_admin"] },
  { path: "/marketplace", label: "Marketplace", allow: ["owner", "manager", "super_admin"] },
  { path: "/my-listings", label: "My Listings", allow: ["owner", "manager", "super_admin"] },
  { path: "/sales", label: "Sales", allow: ["owner", "manager", "super_admin"] },
  { path: "/ai-predictions", label: "AI Predictions", allow: ["owner", "manager", "super_admin"] },
  { path: "/subscription", label: "Subscription", allow: ["owner", "super_admin"] },
  { path: "/admin", label: "Admin Console", allow: ["super_admin"] },
  { path: "/notifications", label: "Notifications", allow: "all" },
  { path: "/settings", label: "Settings", allow: "all" },
  { path: "/more", label: "More", allow: "all" },
  { path: "/help", label: "Help & Support", allow: "all" },
  { path: "/security", label: "Security", allow: "all" },
];

const META: Record<string, { label: string; icon: any; color: string }> = {
  super_admin: { label: "Super Admin", icon: Shield, color: "text-rose-500" },
  owner: { label: "Farm Owner", icon: Crown, color: "text-amber-500" },
  manager: { label: "Manager", icon: UserCog, color: "text-sky-500" },
  worker: { label: "Worker", icon: HardHat, color: "text-emerald-500" },
};

export default function RoleCheck() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { primaryRole, roles, isSuperAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = (primaryRole ?? "owner") as RoleName;
  const meta = META[role] ?? META.owner;
  const Icon = meta.icon;

  const canAccess = (allow: RoleName[] | "all") => {
    if (allow === "all") return true;
    if (isSuperAdmin) return true;
    return allow.includes(role);
  };

  const allowedCount = PAGES.filter((p) => canAccess(p.allow)).length;

  return (
    <div className="p-4 pt-14 space-y-4">
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-2xl bg-muted flex items-center justify-center ${meta.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-semibold truncate">{user?.email ?? "—"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Primary role</p>
            <p className="text-sm font-bold">{meta.label}</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Accessible pages</p>
            <p className="text-sm font-bold">{allowedCount} / {PAGES.length}</p>
          </div>
        </div>
        {roles.length > 1 && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            All roles: {roles.map((r: AppRole) => META[r]?.label ?? r).join(", ")}
          </p>
        )}
      </div>

      <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50">
          <h2 className="text-sm font-semibold">Page Access Matrix</h2>
          <p className="text-[11px] text-muted-foreground">Tap an allowed page to open it.</p>
        </div>
        <ul className="divide-y divide-border/50">
          {PAGES.map((p) => {
            const ok = canAccess(p.allow);
            return (
              <li key={p.path}>
                <button
                  disabled={!ok}
                  onClick={() => ok && navigate(p.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    ok ? "hover:bg-muted/50" : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      ok ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"
                    }`}
                  >
                    {ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{p.path}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {p.allow === "all" ? "all" : p.allow.join(", ")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
