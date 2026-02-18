import { motion } from "framer-motion";
import { Utensils, Clock, TrendingDown, Plus, ChevronRight, AlertTriangle } from "lucide-react";
import StatCard from "@/components/StatCard";
import { useFeedingLogs } from "@/hooks/useFarm";
import { format } from "date-fns";

export default function Feeding() {
  const { data: logs, isLoading } = useFeedingLogs();

  const todayTotal = logs?.reduce((s, l) => s + l.amount_kg, 0) ?? 0;

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
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Utensils className="w-4 h-4" />} label="Total Fed Today" value={`${todayTotal.toFixed(1)} kg`} color="primary" />
          <StatCard icon={<TrendingDown className="w-4 h-4" />} label="Log Count" value={`${logs?.length ?? 0}`} color="teal" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Feeding Logs</h2>
          </div>
          {isLoading ? (
            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : (logs?.length ?? 0) === 0 ? (
            <div className="bg-card rounded-xl p-6 shadow-card text-center">
              <Utensils className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No feeding logs yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs?.map((log, i) => (
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
                      <span className="text-sm font-medium text-foreground">{(log as any).fish_batches?.name ?? "Batch"}</span>
                      <span className="text-[10px] text-muted-foreground">{(log as any).fish_batches?.pond}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{log.feed_type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-foreground">{log.amount_kg} kg</p>
                    <div className="flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{format(new Date(log.feeding_time), "hh:mm a")}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
