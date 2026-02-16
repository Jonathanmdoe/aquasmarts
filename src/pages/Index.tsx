import { motion } from "framer-motion";
import {
  Fish,
  Droplets,
  DollarSign,
  TrendingUp,
  Plus,
  Utensils,
  Heart,
  BarChart3,
  Bell,
  Settings,
} from "lucide-react";
import heroFarm from "@/assets/hero-farm.jpg";
import StatCard from "@/components/StatCard";
import FarmHealthScore from "@/components/FarmHealthScore";
import QuickAction from "@/components/QuickAction";
import AlertCard, { AlertItem } from "@/components/AlertCard";

const alerts: AlertItem[] = [
  {
    id: "1",
    type: "warning",
    title: "Low Dissolved Oxygen",
    description: "Pond 3 - DO dropped to 4.2 mg/L. Increase aeration.",
    time: "12m ago",
  },
  {
    id: "2",
    type: "success",
    title: "Feeding Complete",
    description: "All scheduled feedings for today are done.",
    time: "1h ago",
  },
  {
    id: "3",
    type: "info",
    title: "Harvest Readiness",
    description: "Batch B003 reached target weight of 750g.",
    time: "3h ago",
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative h-52 overflow-hidden">
        <img src={heroFarm} alt="AquaSmart Farm" className="w-full h-full object-cover" />
        <div className="absolute inset-0 gradient-ocean opacity-80" />
        <div className="absolute inset-0 flex flex-col justify-between p-4 pt-10">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold font-display text-primary-foreground"
              >
                AquaSmart
              </motion.h1>
              <p className="text-xs text-primary-foreground/70 mt-0.5">Sunrise Farm · 6 Ponds</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
                <Bell className="w-4.5 h-4.5 text-primary-foreground" />
              </button>
              <button className="w-9 h-9 rounded-xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
                <Settings className="w-4.5 h-4.5 text-primary-foreground" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-1.5">
              <p className="text-[10px] text-primary-foreground/70">Total Biomass</p>
              <p className="text-sm font-bold text-primary-foreground">12,450 kg</p>
            </div>
            <div className="bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-1.5">
              <p className="text-[10px] text-primary-foreground/70">Active Batches</p>
              <p className="text-sm font-bold text-primary-foreground">8</p>
            </div>
            <div className="bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-1.5">
              <p className="text-[10px] text-primary-foreground/70">Today Revenue</p>
              <p className="text-sm font-bold text-primary-foreground">$2,340</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10 space-y-4 pb-4">
        {/* Farm Health Score */}
        <FarmHealthScore score={82} />

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Fish className="w-4 h-4" />}
            label="Total Stock"
            value="42,800"
            change="+3.2%"
            trend="up"
            color="primary"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Avg FCR"
            value="1.42"
            change="-0.05"
            trend="up"
            color="teal"
          />
          <StatCard
            icon={<Droplets className="w-4 h-4" />}
            label="Water Score"
            value="94%"
            change="Stable"
            trend="neutral"
            color="success"
          />
          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Monthly P&L"
            value="$18.2K"
            change="+12%"
            trend="up"
            color="amber"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-2">
            <QuickAction icon={Plus} label="New Batch" />
            <QuickAction icon={Utensils} label="Log Feed" />
            <QuickAction icon={Droplets} label="Water Test" />
            <QuickAction icon={Heart} label="Health" />
          </div>
        </div>

        {/* AI Alerts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Smart Alerts</h2>
            <span className="text-xs text-primary font-medium">View All</span>
          </div>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>

        {/* AI Insights Preview */}
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
            Based on current growth rate, <strong>Batch B003</strong> will reach optimal harvest weight 
            (800g) in <strong>12 days</strong>. Expected yield: <strong>3,400 kg</strong>. 
            Market price forecast: <strong>$4.20/kg</strong>.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button className="text-xs font-medium bg-primary-foreground/15 backdrop-blur rounded-lg px-3 py-1.5">
              View Details
            </button>
            <button className="text-xs font-medium bg-primary-foreground/15 backdrop-blur rounded-lg px-3 py-1.5">
              Schedule Harvest
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
