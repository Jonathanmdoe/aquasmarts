import { motion } from "framer-motion";
import { Utensils, Clock, TrendingDown, ChevronRight, Sun, Moon, CheckCircle2, CircleDashed } from "lucide-react";
import StatCard from "@/components/StatCard";
import { useFeedingLogs, useBatches } from "@/hooks/useFarm";
import AddFeedingForm from "@/components/forms/AddFeedingForm";
import { format, differenceInDays, isToday } from "date-fns";
import { useMemo } from "react";

type FeedStatus = "safe" | "caution" | "danger";

// 21-day fry feeding schedule (grams/day per 5,000 fingerlings)
// Ramps from ~150g/day on day 1 to ~1.2kg/day by day 21
const fryGramsPer5k = (day: number): number => {
  if (day < 1) return 0;
  if (day > 21) return 1200;
  // linear ramp 150 -> 1200 across 21 days
  return Math.round(150 + ((day - 1) / 20) * (1200 - 150));
};

// Target daily feed in kg for a batch
const targetDailyKg = (batch: any): number => {
  if (!batch?.stock_date || !batch?.current_count) return 0;
  const days = differenceInDays(new Date(), new Date(batch.stock_date)) + 1;
  if (days <= 21) {
    return +(fryGramsPer5k(days) * (batch.current_count / 5000) / 1000).toFixed(2);
  }
  // Post-fry: estimate avg weight by days, feed at 3% biomass
  const avgWeightKg = Math.min(0.5, 0.02 + (days - 21) * 0.004); // ~20g at day 22 -> 500g cap
  const biomassKg = avgWeightKg * batch.current_count;
  return +(biomassKg * 0.03).toFixed(2);
};

const rateLog = (amount: number, target: number): FeedStatus => {
  if (target <= 0) return "safe";
  const halfTarget = target / 2;
  const ratio = amount / halfTarget;
  if (ratio >= 0.8 && ratio <= 1.25) return "safe";
  if (ratio >= 0.5 && ratio <= 1.6) return "caution";
  return "danger";
};

const StatusPill = ({ status }: { status: FeedStatus }) => {
  const map = {
    safe: "bg-success/15 text-success border-success/30",
    caution: "bg-amber/15 text-amber border-amber/30",
    danger: "bg-destructive/15 text-destructive border-destructive/30",
  };
  const label = { safe: "On target", caution: "Off", danger: "Way off" }[status];
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[status]}`}>
      {label}
    </span>
  );
};

export default function Feeding() {
  const { data: logs, isLoading } = useFeedingLogs();
  const { data: batches } = useBatches();

  const todayTotal = useMemo(
    () => logs?.filter(l => isToday(new Date(l.feeding_time))).reduce((s, l) => s + l.amount_kg, 0) ?? 0,
    [logs]
  );

  // Today's plan per batch (AM = before 12:00, PM = >= 12:00)
  const todaysPlan = useMemo(() => {
    if (!batches) return [];
    return batches
      .filter((b: any) => b.status !== "harvested" && b.current_count > 0)
      .map((b: any) => {
        const target = targetDailyKg(b);
        const todays = logs?.filter(l => l.batch_id === b.id && isToday(new Date(l.feeding_time))) ?? [];
        const am = todays.find(l => new Date(l.feeding_time).getHours() < 12);
        const pm = todays.find(l => new Date(l.feeding_time).getHours() >= 12);
        return { batch: b, target, am, pm };
      });
  }, [batches, logs]);

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Feeding</h1>
            <p className="text-xs text-primary-foreground/70">Smart feeding management</p>
          </div>
          <AddFeedingForm />
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Utensils className="w-4 h-4" />} label="Total Fed Today" value={`${todayTotal.toFixed(1)} kg`} color="primary" />
          <StatCard icon={<TrendingDown className="w-4 h-4" />} label="Log Count" value={`${logs?.length ?? 0}`} color="teal" />
        </div>

        {/* Today's Plan Strip */}
        {todaysPlan.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">Today's Plan</h2>
              <span className="text-[10px] text-muted-foreground">AM · PM</span>
            </div>
            <div className="space-y-2">
              {todaysPlan.map(({ batch, target, am, pm }) => {
                const fed = (am?.amount_kg ?? 0) + (pm?.amount_kg ?? 0);
                const pct = target > 0 ? Math.min(100, Math.round((fed / target) * 100)) : 0;
                const days = batch.stock_date ? differenceInDays(new Date(), new Date(batch.stock_date)) + 1 : 0;
                const isFry = days > 0 && days <= 21;
                return (
                  <div key={batch.id} className="bg-card rounded-xl p-3 shadow-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">{batch.name}</span>
                          {isFry && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                              FRY D{days}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Target {target.toFixed(2)} kg/day · Fed {fed.toFixed(2)} kg
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <Sun className="w-3.5 h-3.5 text-amber" />
                          {am ? <CheckCircle2 className="w-4 h-4 text-success" /> : <CircleDashed className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="flex items-center gap-1">
                          <Moon className="w-3.5 h-3.5 text-primary" />
                          {pm ? <CheckCircle2 className="w-4 h-4 text-success" /> : <CircleDashed className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 80 && pct <= 120 ? "bg-success" : pct < 80 ? "bg-amber" : "bg-destructive"
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
              {logs?.map((log, i) => {
                const batch = batches?.find((b: any) => b.id === log.batch_id);
                const target = batch ? targetDailyKg(batch) : 0;
                const status = rateLog(log.amount_kg, target);
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      status === "safe" ? "bg-success" : status === "caution" ? "bg-amber" : "bg-destructive"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{(log as any).fish_batches?.name ?? "Batch"}</span>
                        <span className="text-[10px] text-muted-foreground">{(log as any).fish_batches?.pond}</span>
                        {target > 0 && <StatusPill status={status} />}
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
