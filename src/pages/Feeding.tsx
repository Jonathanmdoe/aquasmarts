import { motion } from "framer-motion";
import { Utensils, Clock, TrendingDown, Plus, ChevronRight, AlertTriangle } from "lucide-react";
import StatCard from "@/components/StatCard";

const feedingLogs = [
  { id: "1", batch: "B001", pond: "Pond 1", species: "Tilapia", amount: 24.5, type: "Grower Pellet 35%", time: "07:30 AM", status: "completed" },
  { id: "2", batch: "B002", pond: "Pond 2", species: "Catfish", amount: 12.8, type: "Starter Micro 45%", time: "08:00 AM", status: "completed" },
  { id: "3", batch: "B003", pond: "Pond 3", species: "Tilapia", amount: 28.2, type: "Finisher 28%", time: "12:30 PM", status: "pending" },
  { id: "4", batch: "B004", pond: "Pond 5", species: "Carp", amount: 5.0, type: "Fry Powder 55%", time: "06:00 AM", status: "completed" },
  { id: "5", batch: "B001", pond: "Pond 1", species: "Tilapia", amount: 24.5, type: "Grower Pellet 35%", time: "05:00 PM", status: "scheduled" },
];

const feedSchedule = [
  { time: "06:00", label: "Morning 1", done: true },
  { time: "08:00", label: "Morning 2", done: true },
  { time: "12:30", label: "Midday", done: false },
  { time: "17:00", label: "Evening", done: false },
];

export default function Feeding() {
  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Feeding</h1>
            <p className="text-xs text-primary-foreground/70">Smart feeding management</p>
          </div>
          <button className="w-10 h-10 rounded-xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>

        {/* Today's Schedule Timeline */}
        <div className="flex items-center gap-3">
          {feedSchedule.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                s.done
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-primary-foreground/5 text-primary-foreground/50 border border-primary-foreground/20"
              }`}>
                {s.done ? "✓" : i + 1}
              </div>
              <span className="text-[9px] text-primary-foreground/60">{s.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Utensils className="w-4 h-4" />}
            label="Total Fed Today"
            value="70.3 kg"
            color="primary"
          />
          <StatCard
            icon={<TrendingDown className="w-4 h-4" />}
            label="Avg FCR"
            value="1.42"
            change="-0.03"
            trend="up"
            color="teal"
          />
        </div>

        {/* AI Feeding Alert */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-light border border-amber/20 rounded-2xl p-3 flex items-start gap-3"
        >
          <AlertTriangle className="w-4 h-4 text-amber mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground">AI Recommendation</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Reduce feeding rate for Pond 3 by 15%. Water temperature dropped to 24°C. Risk of overfeeding.
            </p>
          </div>
        </motion.div>

        {/* Feeding Logs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Today's Logs</h2>
            <span className="text-xs text-primary font-medium">History</span>
          </div>
          <div className="space-y-2">
            {feedingLogs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  log.status === "completed" ? "bg-success" :
                  log.status === "pending" ? "bg-amber" : "bg-muted-foreground"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{log.batch}</span>
                    <span className="text-[10px] text-muted-foreground">{log.pond}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{log.type}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-foreground">{log.amount} kg</p>
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{log.time}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
