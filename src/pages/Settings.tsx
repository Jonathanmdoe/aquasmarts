import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, MapPin, Fish, LogOut, ChevronRight,
  Bell, Moon, Sun, Shield, HelpCircle, Save, Users, CreditCard, Crown, ClipboardList
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import TeamManagement from "@/components/TeamManagement";
import UpgradeGate from "@/components/UpgradeGate";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useTheme } from "@/hooks/useTheme";
import { useUserRole } from "@/hooks/useUserRole";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: farm, refetch: refetchFarm } = useFarm();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { theme, toggleTheme } = useTheme();
  const { isSuperAdmin } = useUserRole();

  const [fullName, setFullName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [numPonds, setNumPonds] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (farm) {
      setFarmName(farm.name);
      setFarmLocation(farm.location ?? "");
      setNumPonds(farm.num_ponds ?? 0);
    }
  }, [farm]);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.full_name) setFullName(data.full_name);
        });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Not signed in", description: "Please sign in again.", variant: "destructive" });
      return;
    }
    setSaving(true);

    const ops: Promise<any>[] = [
      Promise.resolve(supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id)),
    ];
    if (farm) {
      ops.push(
        Promise.resolve(
          supabase
            .from("farms")
            .update({ name: farmName, location: farmLocation, num_ponds: numPonds })
            .eq("id", farm.id)
        )
      );
    }

    const results = await Promise.all(ops);
    const err = results.find((r) => r.error)?.error;

    if (err) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } else if (!farm) {
      toast({ title: "Profile saved", description: "Finish farm setup to edit farm details.", });
      navigate("/farm-setup");
    } else {
      toast({ title: "Saved!", description: "Your profile has been updated." });
      refetchFarm();
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const menuItems = [
    ...(isSuperAdmin ? [{ icon: Shield, label: "Admin Dashboard", desc: "Platform overview", onClick: () => navigate("/admin") }] : []),
    { icon: CreditCard, label: "Subscription", desc: "Manage your plan", onClick: () => navigate("/subscription") },
    { icon: ClipboardList, label: "Sales Records", desc: "Track buyers & deliveries", onClick: () => navigate("/sales") },
    
    { icon: Bell, label: "Notifications", desc: "Alert preferences", onClick: () => navigate("/notifications") },
    { icon: Shield, label: "Security", desc: "Password & 2FA", onClick: () => navigate("/security") },
    { icon: HelpCircle, label: "Help & Support", desc: "FAQs & contact", onClick: () => navigate("/help") },
  ];

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <h1 className="text-xl font-bold font-display text-primary-foreground">Settings</h1>
        <p className="text-xs text-primary-foreground/70 mt-1">Profile & farm management</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-4">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-card p-4"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl gradient-ocean flex items-center justify-center">
              <User className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{fullName || "Farmer"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Farm Settings */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-card p-4"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Fish className="w-4 h-4 text-primary" /> Farm Details
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Farm Name</label>
              <input value={farmName} onChange={(e) => setFarmName(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={farmLocation} onChange={(e) => setFarmLocation(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Number of Ponds</label>
              <input type="number" min={0} value={numPonds} onChange={(e) => setNumPonds(Number(e.target.value))}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4 gradient-ocean text-primary-foreground font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </motion.div>

        {/* Team Management */}
        <UpgradeGate feature="team_management" fallbackMessage="Team management with roles and invitations requires the Pro plan.">
          <TeamManagement />
        </UpgradeGate>

        {/* Menu */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl shadow-card overflow-hidden"
        >
          {menuItems.map((item, i) => (
            <button key={i} onClick={item.onClick} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/50 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </motion.div>

        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-card rounded-2xl shadow-card p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                {theme === "dark" ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-accent" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className={`w-11 h-6 rounded-full transition-colors relative ${theme === "dark" ? "bg-primary" : "bg-muted"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${theme === "dark" ? "translate-x-[22px]" : "translate-x-0.5"}`} />
            </button>
          </div>
        </motion.div>



        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleLogout}
          className="w-full bg-danger-light border border-danger/20 text-danger font-semibold py-3 rounded-2xl text-sm flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </motion.button>
      </div>
    </div>
  );
}
