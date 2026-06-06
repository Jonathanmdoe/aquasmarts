import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, ShoppingBag, Users, Globe, DollarSign, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatTZS } from "@/lib/currency";

const REGIONS = ["Global", "Africa", "Asia-Pacific", "Europe", "Middle East", "Americas"];

export default function MarketplaceAnalytics() {
  const navigate = useNavigate();
  const [region, setRegion] = useState("Global");

  const { data: listings = [] } = useQuery({
    queryKey: ["mp_listings_all"],
    queryFn: async () => {
      const { data } = await supabase.from("marketplace_listings" as any).select("*");
      return (data as any[]) || [];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["mp_orders_all"],
    queryFn: async () => {
      const { data } = await supabase.from("marketplace_orders" as any).select("*");
      return (data as any[]) || [];
    },
  });

  const totalVolume = orders.reduce((s: number, o: any) => s + Number(o.total), 0);
  const activeSellers = new Set(listings.map((l: any) => l.user_id)).size;
  const countries = new Set(listings.map((l: any) => l.location?.split(",").pop()?.trim()).filter(Boolean)).size;
  const platformFees = orders.reduce((s: number, o: any) => s + Number(o.platform_fee), 0);

  const kpis = [
    { label: "Trades", value: orders.length, icon: ShoppingBag },
    { label: "Volume", value: formatTZS(totalVolume), icon: DollarSign },
    { label: "Active Sellers", value: activeSellers, icon: Users },
    { label: "Countries", value: countries, icon: Globe },
    { label: "Platform Fees", value: formatTZS(platformFees), icon: TrendingUp },
    { label: "Avg Order", value: orders.length ? formatTZS(Math.round(totalVolume / orders.length)) : "—", icon: Award },
  ];

  // Monthly volume bar chart
  const monthly = useMemo(() => {
    const m: Record<string, number> = {};
    orders.forEach((o: any) => {
      const k = new Date(o.created_at).toLocaleString("en-US", { month: "short" });
      m[k] = (m[k] || 0) + Number(o.total);
    });
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((mo) => ({ month: mo, value: m[mo] || 0 }));
  }, [orders]);
  const maxV = Math.max(...monthly.map((m) => m.value), 1);

  // Top sellers
  const sellerStats = useMemo(() => {
    const s: Record<string, { vol: number; count: number }> = {};
    orders.forEach((o: any) => {
      if (!s[o.seller_id]) s[o.seller_id] = { vol: 0, count: 0 };
      s[o.seller_id].vol += Number(o.total);
      s[o.seller_id].count += 1;
    });
    return Object.entries(s).sort((a, b) => b[1].vol - a[1].vol).slice(0, 5);
  }, [orders]);

  // Species ranking by region
  const speciesRank = useMemo(() => {
    const filtered = region === "Global" ? listings : listings.filter((l: any) => (l.location || "").toLowerCase().includes(region.toLowerCase()));
    const s: Record<string, number> = {};
    filtered.forEach((l: any) => { s[l.species] = (s[l.species] || 0) + 1; });
    return Object.entries(s).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [listings, region]);

  return (
    <div className="min-h-screen pb-6">
      <div className="gradient-ocean px-4 pt-10 pb-5">
        <button onClick={() => navigate(-1)} className="text-primary-foreground/80 mb-2 flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
        <h1 className="text-xl font-bold font-display text-primary-foreground">Marketplace Analytics</h1>
        <p className="text-xs text-primary-foreground/70">Trade pulse across the network</p>
      </div>

      <div className="px-4 -mt-3 grid grid-cols-3 gap-2">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl p-3 shadow-card">
              <Icon className="w-3.5 h-3.5 text-primary mb-1" />
              <p className="text-sm font-bold leading-tight">{k.value}</p>
              <p className="text-[10px] text-muted-foreground">{k.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* World map placeholder with glowing hubs */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-sm font-semibold mb-3">Global Trade Hubs</p>
          <div className="relative h-32 rounded-xl bg-gradient-to-br from-ocean-surface to-primary/10 overflow-hidden">
            {[
              { top: "35%", left: "48%" }, { top: "45%", left: "55%" },
              { top: "55%", left: "52%" }, { top: "30%", left: "20%" },
              { top: "40%", left: "80%" }, { top: "60%", left: "75%" },
            ].map((p, i) => (
              <motion.div key={i} style={p} animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                className="absolute w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
            ))}
          </div>
        </div>

        {/* Region filter + species */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex gap-1 mb-3 overflow-x-auto no-scrollbar">
            {REGIONS.map((r) => (
              <button key={r} onClick={() => setRegion(r)}
                className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${region === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{r}</button>
            ))}
          </div>
          <p className="text-xs font-semibold mb-2">Top Species — {region}</p>
          {speciesRank.length === 0 ? <p className="text-xs text-muted-foreground">No data for this region.</p> : (
            <div className="space-y-1.5">
              {speciesRank.map(([sp, n], i) => (
                <div key={sp} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold w-4 text-muted-foreground">#{i + 1}</span>
                  <span className="text-xs flex-1">{sp}</span>
                  <span className="text-[11px] font-semibold text-primary">{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly bar */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-sm font-semibold mb-3">Monthly Volume</p>
          <div className="flex items-end gap-1 h-24">
            {monthly.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-primary/20 rounded-t-md relative overflow-hidden" style={{ height: `${(m.value / maxV) * 100}%`, minHeight: "2px" }}>
                  <div className="absolute inset-x-0 bottom-0 bg-primary" style={{ height: "100%" }} />
                </div>
                <span className="text-[8px] text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top sellers */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-sm font-semibold mb-2">Top 5 Sellers</p>
          {sellerStats.length === 0 ? <p className="text-xs text-muted-foreground">No sales yet.</p> : (
            <div className="space-y-2">
              {sellerStats.map(([sid, st], i) => (
                <div key={sid} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">#{i + 1}</div>
                  <div className="flex-1">
                    <p className="text-xs font-medium font-mono">{sid.slice(0, 8)}…</p>
                    <p className="text-[10px] text-muted-foreground">{st.count} trades</p>
                  </div>
                  <p className="text-xs font-semibold">{formatTZS(st.vol)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
