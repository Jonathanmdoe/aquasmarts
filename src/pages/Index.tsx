import { motion } from "framer-motion";
import {
  Fish, Droplets, DollarSign, TrendingUp, Plus, Utensils,
  Heart, BarChart3, Bell, Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroFarm from "@/assets/hero-farm.jpg";
import StatCard from "@/components/StatCard";
import FarmHealthScore from "@/components/FarmHealthScore";
import QuickAction from "@/components/QuickAction";
import AlertCard from "@/components/AlertCard";
import { useFarm, useBatches, useFinancialRecords } from "@/hooks/useFarm";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { formatTZSCompact } from "@/lib/currency";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: farm } = useFarm();
  const { data: batches } = useBatches();
  const { data: financials } = useFinancialRecords();
  const { alerts } = useSmartAlerts();

  const activeBatches = batches?.filter((b) => b.status === "active" || b.status === "stocked") ?? [];
  const totalBiomass = batches?.reduce((s, b) => s + (b.biomass ?? 0), 0) ?? 0;
  const totalStock = batches?.reduce((s, b) => s + b.current_count, 0) ?? 0;
  const avgFCR = activeBatches.length > 0
    ? (activeBatches.reduce((s, b) => s + (b.fcr ?? 0), 0) / activeBatches.length).toFixed(2)
    : "0";

  const todayRevenue = financials
    ?.filter((f) => f.record_type === "revenue")
    .reduce((s, f) => s + f.amount, 0) ?? 0;

  const monthlyRevenue = todayRevenue;
  const monthlyExpense = financials
    ?.filter((f) => f.record_type === "expense")
    .reduce((s, f) => s + f.amount, 0) ?? 0;
  const monthlyPnL = monthlyRevenue - monthlyExpense;

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative h-52 overflow-hidden">
        <img src={heroFarm} alt="AquaSmart Farm" className="w-full h-full object-cover" />
        <div className="absolute inset-0 gradient-ocean opacity-80" />
        <div className="absolute inset-0 flex flex-col justify-between p-4 pt-10">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold font-display text-primary-foreground">
                AquaSmart
              </motion.h1>
              <p className="text-xs text-primary-foreground/70 mt-0.5">
                {farm?.name ?? "My Farm"} · {farm?.num_ponds ?? 0} Ponds
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
                <Bell className="w-4.5 h-4.5 text-primary-foreground" />
              </button>
              <button onClick={() => navigate("/settings")} className="w-9 h-9 rounded-xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
                <Settings className="w-4.5 h-4.5 text-primary-foreground" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-1.5">
              <p className="text-[10px] text-primary-foreground/70">Total Biomass</p>
              <p className="text-sm font-bold text-primary-foreground">{totalBiomass.toLocaleString()} kg</p>
            </div>
            <div className="bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-1.5">
              <p className="text-[10px] text-primary-foreground/70">Active Batches</p>
              <p className="text-sm font-bold text-primary-foreground">{activeBatches.length}</p>
            </div>
            <div className="bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-1.5">
              <p className="text-[10px] text-primary-foreground/70">Revenue</p>
              <p className="text-sm font-bold text-primary-foreground">{formatTZSCompact(todayRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10 space-y-4 pb-4">
        <FarmHealthScore score={82} />

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Fish className="w-4 h-4" />} label="Total Stock" value={totalStock.toLocaleString()} color="primary" />
          <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Avg FCR" value={avgFCR} color="teal" />
          <StatCard icon={<Droplets className="w-4 h-4" />} label="Water Score" value="94%" change="Stable" trend="neutral" color="success" />
          <StatCard icon={<DollarSign className="w-4 h-4" />} label="Monthly P&L" value={formatTZSCompact(monthlyPnL)} color="amber" />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-2">
            <QuickAction icon={Plus} label="New Batch" onClick={() => navigate("/batches")} />
            <QuickAction icon={Utensils} label="Log Feed" onClick={() => navigate("/feeding")} />
            <QuickAction icon={Droplets} label="Water Test" onClick={() => navigate("/water")} />
            <QuickAction icon={Heart} label="Health" onClick={() => navigate("/health")} />
          </div>
        </div>

        {/* Smart Alerts (real-time) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Smart Alerts</h2>
            <span className="text-xs text-primary font-medium">View All</span>
          </div>
          {alerts.length === 0 ? (
            <div className="bg-card rounded-xl p-4 shadow-card text-center">
              <p className="text-xs text-muted-foreground">No alerts yet. Your farm is running smoothly! 🐟</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="gradient-ocean rounded-2xl p-4 text-primary-foreground"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4" />
            <h3 className="text-sm font-semibold">AI Prediction</h3>
          </div>
          <p className="text-xs text-primary-foreground/80 leading-relaxed">
            {activeBatches.length > 0 ? (
              <>Track your <strong>{activeBatches.length} active batches</strong> for harvest readiness.
              Total biomass: <strong>{totalBiomass.toLocaleString()} kg</strong>.</>
            ) : (
              <>Start by adding your first batch to get AI-powered growth predictions and harvest forecasts.</>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
