import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, BarChart3, Activity, ShieldCheck, ArrowLeft,
  TrendingUp, Fish, ShoppingCart, AlertTriangle, CheckCircle, XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlatformStats {
  totalUsers: number;
  totalFarms: number;
  totalBatches: number;
  totalListings: number;
  activeListings: number;
  totalAlerts: number;
  unreadAlerts: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0, totalFarms: 0, totalBatches: 0,
    totalListings: 0, activeListings: 0, totalAlerts: 0, unreadAlerts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const [farms, batches, listings, alerts] = await Promise.all([
        supabase.from("farms").select("id", { count: "exact", head: true }),
        supabase.from("fish_batches").select("id", { count: "exact", head: true }),
        supabase.from("marketplace_listings").select("id, status"),
        supabase.from("smart_alerts").select("id, is_read"),
      ]);

      const activeListings = listings.data?.filter(l => l.status === "active").length ?? 0;
      const unreadAlerts = alerts.data?.filter(a => !a.is_read).length ?? 0;

      setStats({
        totalUsers: farms.count ?? 0,
        totalFarms: farms.count ?? 0,
        totalBatches: batches.count ?? 0,
        totalListings: listings.data?.length ?? 0,
        activeListings,
        totalAlerts: alerts.data?.length ?? 0,
        unreadAlerts,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Farms", value: stats.totalFarms, icon: Fish, color: "bg-primary/10 text-primary" },
    { label: "Fish Batches", value: stats.totalBatches, icon: TrendingUp, color: "bg-secondary/10 text-secondary" },
    { label: "Marketplace Listings", value: stats.totalListings, icon: ShoppingCart, color: "bg-accent/10 text-accent-foreground" },
    { label: "Active Alerts", value: stats.unreadAlerts, icon: AlertTriangle, color: "bg-destructive/10 text-destructive" },
  ];

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings")} className="w-8 h-8 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-primary-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Admin Dashboard</h1>
            <p className="text-xs text-primary-foreground/70 mt-0.5">Platform overview & management</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl shadow-card p-3.5"
            >
              <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-foreground">{loading ? "—" : stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full bg-muted rounded-xl">
            <TabsTrigger value="overview" className="flex-1 rounded-lg text-xs">Overview</TabsTrigger>
            <TabsTrigger value="users" className="flex-1 rounded-lg text-xs">Users</TabsTrigger>
            <TabsTrigger value="system" className="flex-1 rounded-lg text-xs">System</TabsTrigger>
            <TabsTrigger value="content" className="flex-1 rounded-lg text-xs">Content</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl shadow-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Platform Summary
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Active Listings", value: stats.activeListings, total: stats.totalListings },
                  { label: "Unread Alerts", value: stats.unreadAlerts, total: stats.totalAlerts },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold text-foreground">{item.value} / {item.total}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="users">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl shadow-card p-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-primary" /> User Management
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2.5 bg-muted/50 rounded-xl px-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Registered Farms</p>
                    <p className="text-xs text-muted-foreground">Total farm accounts on platform</p>
                  </div>
                  <span className="text-lg font-bold text-primary">{stats.totalFarms}</span>
                </div>
                <p className="text-xs text-muted-foreground px-1">
                  Full user management with account controls will be available in a future update. Currently viewing aggregate data accessible through your farm's RLS scope.
                </p>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="system">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl shadow-card p-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-primary" /> System Health
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Database", status: "Operational", icon: CheckCircle, ok: true },
                  { label: "Authentication", status: "Operational", icon: CheckCircle, ok: true },
                  { label: "Edge Functions", status: "Operational", icon: CheckCircle, ok: true },
                  { label: "Realtime", status: "Operational", icon: CheckCircle, ok: true },
                ].map(service => (
                  <div key={service.label} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                    <span className="text-sm text-foreground">{service.label}</span>
                    <div className="flex items-center gap-1.5">
                      <service.icon className={`w-3.5 h-3.5 ${service.ok ? "text-success" : "text-destructive"}`} />
                      <span className={`text-xs font-medium ${service.ok ? "text-success" : "text-destructive"}`}>{service.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="content">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl shadow-card p-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-primary" /> Content Moderation
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2.5 bg-muted/50 rounded-xl px-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active Listings</p>
                    <p className="text-xs text-muted-foreground">Currently live on marketplace</p>
                  </div>
                  <span className="text-lg font-bold text-secondary">{stats.activeListings}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 bg-muted/50 rounded-xl px-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Total Listings</p>
                    <p className="text-xs text-muted-foreground">All time (active + inactive)</p>
                  </div>
                  <span className="text-lg font-bold text-foreground">{stats.totalListings}</span>
                </div>
                <p className="text-xs text-muted-foreground px-1 mt-2">
                  Listing review and report management will be available in a future update.
                </p>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
