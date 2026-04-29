import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, BarChart3, Activity, ShieldCheck, ArrowLeft,
  TrendingUp, Fish, ShoppingCart, AlertTriangle, CheckCircle, ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { formatTZS } from "@/lib/currency";

interface PlatformStats {
  totalFarms: number;
  totalBatches: number;
  totalListings: number;
  activeListings: number;
  totalAlerts: number;
  unreadAlerts: number;
}

type DetailKind = "farms" | "batches" | "listings" | "alerts" | null;

export default function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats>({
    totalFarms: 0, totalBatches: 0,
    totalListings: 0, activeListings: 0, totalAlerts: 0, unreadAlerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DetailKind>(null);
  const [detailRows, setDetailRows] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const [farms, batches, listings, alerts] = await Promise.all([
        supabase.from("farms").select("id", { count: "exact", head: true }),
        supabase.from("fish_batches").select("id", { count: "exact", head: true }),
        supabase.from("marketplace_listings").select("id, status"),
        supabase.from("smart_alerts").select("id, is_read"),
      ]);

      setStats({
        totalFarms: farms.count ?? 0,
        totalBatches: batches.count ?? 0,
        totalListings: listings.data?.length ?? 0,
        activeListings: listings.data?.filter(l => l.status === "active").length ?? 0,
        totalAlerts: alerts.data?.length ?? 0,
        unreadAlerts: alerts.data?.filter(a => !a.is_read).length ?? 0,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const openDetail = async (kind: Exclude<DetailKind, null>) => {
    setDetail(kind);
    setDetailLoading(true);
    setDetailRows([]);
    let query;
    if (kind === "farms") {
      query = supabase.from("farms")
        .select("id, name, location, operation_type, production_system, num_ponds, created_at")
        .order("created_at", { ascending: false }).limit(100);
    } else if (kind === "batches") {
      query = supabase.from("fish_batches")
        .select("id, name, species, pond, stage, status, current_count, biomass, created_at")
        .order("created_at", { ascending: false }).limit(100);
    } else if (kind === "listings") {
      query = supabase.from("marketplace_listings")
        .select("id, title, category, species, price, unit, quantity, location, status, created_at")
        .order("created_at", { ascending: false }).limit(100);
    } else {
      query = supabase.from("smart_alerts")
        .select("id, title, description, type, source, is_read, created_at")
        .order("created_at", { ascending: false }).limit(100);
    }
    const { data } = await query;
    setDetailRows(data ?? []);
    setDetailLoading(false);
  };

  const statCards = [
    { key: "farms" as const, label: "Total Farms", value: stats.totalFarms, icon: Fish, color: "bg-primary/10 text-primary" },
    { key: "batches" as const, label: "Fish Batches", value: stats.totalBatches, icon: TrendingUp, color: "bg-secondary/10 text-secondary" },
    { key: "listings" as const, label: "Marketplace Listings", value: stats.totalListings, icon: ShoppingCart, color: "bg-accent/10 text-accent-foreground" },
    { key: "alerts" as const, label: "Active Alerts", value: stats.unreadAlerts, icon: AlertTriangle, color: "bg-destructive/10 text-destructive" },
  ];

  const detailTitle: Record<Exclude<DetailKind, null>, string> = {
    farms: "All Farms", batches: "All Fish Batches", listings: "All Listings", alerts: "All Alerts",
  };

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings")} className="w-8 h-8 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-primary-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Admin Dashboard</h1>
            <p className="text-xs text-primary-foreground/70 mt-0.5">Tap any card to view details</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, i) => (
            <motion.button
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => openDetail(stat.key)}
              className="bg-card rounded-2xl shadow-card p-3.5 text-left active:bg-muted/40 transition-colors relative"
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground">{loading ? "—" : stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.button>
          ))}
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full bg-muted rounded-xl">
            <TabsTrigger value="overview" className="flex-1 rounded-lg text-xs">Overview</TabsTrigger>
            <TabsTrigger value="system" className="flex-1 rounded-lg text-xs">System</TabsTrigger>
            <TabsTrigger value="content" className="flex-1 rounded-lg text-xs">Content</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="bg-card rounded-2xl shadow-card p-4 space-y-3">
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
            </div>
          </TabsContent>

          <TabsContent value="system">
            <div className="bg-card rounded-2xl shadow-card p-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-primary" /> System Health
              </h3>
              <div className="space-y-2">
                {["Database", "Authentication", "Edge Functions", "Realtime"].map(s => (
                  <div key={s} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                    <span className="text-sm text-foreground">{s}</span>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-success" />
                      <span className="text-xs font-medium text-success">Operational</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content">
            <button
              onClick={() => openDetail("listings")}
              className="w-full bg-card rounded-2xl shadow-card p-4 text-left"
            >
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-primary" /> Content Moderation
              </h3>
              <p className="text-xs text-muted-foreground">Tap to review {stats.totalListings} listings ({stats.activeListings} active)</p>
            </button>
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>{detail && detailTitle[detail]}</SheetTitle>
            <SheetDescription>{detailRows.length} record{detailRows.length === 1 ? "" : "s"}</SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-2">
            {detailLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>}
            {!detailLoading && detailRows.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No records found</p>
            )}

            {!detailLoading && detail === "farms" && detailRows.map(f => (
              <div key={f.id} className="bg-muted/40 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{f.name}</p>
                  <span className="text-[10px] text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{f.location || "No location"} • {f.num_ponds ?? 0} ponds</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{f.operation_type?.replace("_", " ")} • {f.production_system}</p>
              </div>
            ))}

            {!detailLoading && detail === "batches" && detailRows.map(b => (
              <div key={b.id} className="bg-muted/40 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{b.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{b.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{b.species} • {b.pond || "—"} • {b.stage}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{b.current_count} fish • {b.biomass} kg biomass</p>
              </div>
            ))}

            {!detailLoading && detail === "listings" && detailRows.map(l => (
              <div key={l.id} className="bg-muted/40 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{l.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${l.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{l.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{l.category} • {l.species || "—"} • {l.location}</p>
                <p className="text-[10px] text-foreground mt-0.5 font-medium">{formatTZS(Number(l.price))} / {l.unit} • Qty: {l.quantity}</p>
              </div>
            ))}

            {!detailLoading && detail === "alerts" && detailRows.map(a => (
              <div key={a.id} className="bg-muted/40 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{a.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${a.is_read ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"}`}>{a.is_read ? "read" : "unread"}</span>
                </div>
                {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{a.type} • {a.source} • {new Date(a.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
