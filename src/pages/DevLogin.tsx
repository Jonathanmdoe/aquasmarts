import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Crown, UserCog, HardHat, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Role = "super_admin" | "owner" | "manager" | "worker";

const ACCOUNTS: {
  role: Role;
  label: string;
  email: string;
  password: string;
  fullName: string;
  icon: any;
  color: string;
  desc: string;
}[] = [
  {
    role: "super_admin",
    label: "Admin",
    email: "admin@aquasmart.test",
    password: "Admin@12345",
    fullName: "Platform Admin",
    icon: Shield,
    color: "from-rose-500 to-red-600",
    desc: "Full platform control · Admin dashboard",
  },
  {
    role: "owner",
    label: "Farm Owner",
    email: "owner@aquasmart.test",
    password: "Owner@12345",
    fullName: "Farm Owner",
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    desc: "Owns the farm · Full farm access",
  },
  {
    role: "manager",
    label: "Manager",
    email: "manager@aquasmart.test",
    password: "Manager@12345",
    fullName: "Farm Manager",
    icon: UserCog,
    color: "from-sky-500 to-blue-600",
    desc: "Manages operations · No billing",
  },
  {
    role: "worker",
    label: "Worker",
    email: "worker@aquasmart.test",
    password: "Worker@12345",
    fullName: "Farm Worker",
    icon: HardHat,
    color: "from-emerald-500 to-teal-600",
    desc: "Daily tasks · Simplified view",
  },
];

export default function DevLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const loginAs = async (acc: (typeof ACCOUNTS)[number]) => {
    setLoading(acc.role);
    try {
      // 1. Sign out any current session
      await supabase.auth.signOut();

      // 2. Ensure account exists with the right role (server-side)
      const { data, error } = await supabase.functions.invoke("dev-seed-account", {
        body: {
          email: acc.email,
          password: acc.password,
          fullName: acc.fullName,
          role: acc.role,
        },
      });
      if (error || !data?.ok) throw new Error(data?.error || error?.message || "Seed failed");

      // 3. Sign in
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: acc.email,
        password: acc.password,
      });
      if (signErr) throw signErr;

      toast.success(`Signed in as ${acc.label}`);
      navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e.message ?? "Could not sign in");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl gradient-ocean flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-display">Dev Quick Login</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Pick a role to instantly sign in with a test account
          </p>
        </div>

        <div className="space-y-3">
          {ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            const isLoading = loading === acc.role;
            return (
              <button
                key={acc.role}
                onClick={() => loginAs(acc)}
                disabled={!!loading}
                className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-3 text-left hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${acc.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{acc.label}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{acc.desc}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono truncate">
                    {acc.email}
                  </p>
                </div>
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-xl p-3 text-[11px] text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">How it works</p>
          <p>• Admin → auto-redirects to Admin dashboard</p>
          <p>• Owner → main dashboard (create a farm first time)</p>
          <p>• Manager → main dashboard with team access</p>
          <p>• Worker → simplified Worker dashboard</p>
          <p className="pt-1">Password is the same as email prefix, e.g. <span className="font-mono">Admin@12345</span></p>
        </div>

        <button
          onClick={() => navigate("/auth")}
          className="w-full mt-4 text-xs text-muted-foreground underline"
        >
          Or use normal login →
        </button>
      </div>
    </div>
  );
}
