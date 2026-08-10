import { motion } from "framer-motion";
import { Utensils, Clock, TrendingDown, ChevronRight, Sun, Moon, CheckCircle2, CircleDashed, Package, Plus, X } from "lucide-react";
import StatCard from "@/components/StatCard";
import { useFeedingLogs, useBatches } from "@/hooks/useFarm";
import { useFeedStock, useUpsertFeedStock } from "@/hooks/useFinance";
import AddFeedingForm from "@/components/forms/AddFeedingForm";
import { format, differenceInDays, isToday } from "date-fns";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

type FeedStatus = "safe" | "caution" | "danger";
export type FeedMode = "table" | "standard";

// Grams of feed per feeding time, per 5,000 fingerlings (hatchery 21-day fry table)
const FRY_TABLE_PER_5K = [2, 4, 7, 9, 11, 11, 12, 13, 15, 16, 16, 17, 18, 18, 18, 18, 18, 19, 19, 20, 20];

// 21-day fry feeding schedule (grams/day per 5,000 fingerlings) — smooth ramp
const fryGramsPer5k = (day: number): number => {
  if (day < 1) return 0;
  if (day > 21) return 1200;
  return Math.round(150 + ((day - 1) / 20) * (1200 - 150));
};

// Target daily feed in kg for a batch
const targetDailyKg = (batch: any, mode: FeedMode = "standard", feedingsPerDay = 5): number => {
  if (!batch?.stock_date || !batch?.current_count) return 0;
  const days = differenceInDays(new Date(), new Date(batch.stock_date)) + 1;
  if (days <= 21) {
    if (mode === "table") {
      const perFeedPer5k = FRY_TABLE_PER_5K[Math.max(0, days - 1)] ?? 0;
      const grams = perFeedPer5k * (batch.current_count / 5000) * feedingsPerDay;
      return +(grams / 1000).toFixed(2);
    }
    return +(fryGramsPer5k(days) * (batch.current_count / 5000) / 1000).toFixed(2);
  }
  // Post-fry: estimate avg weight by days, feed at 3% biomass
  const avgWeightKg = Math.min(0.5, 0.02 + (days - 21) * 0.004); // ~20g at day 22 -> 500g cap
  const biomassKg = avgWeightKg * batch.current_count;
  return +(biomassKg * 0.03).toFixed(2);
};

const rateLog = (amount: number, target: number, feedingsPerDay = 2): FeedStatus => {
  if (target <= 0) return "safe";
  const perFeed = target / Math.max(1, feedingsPerDay);
  const ratio = amount / perFeed;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeBatchId = searchParams.get("batchId");
  const { data: allLogs, isLoading } = useFeedingLogs();
  const { data: batches } = useBatches();
  const { data: stocks } = useFeedStock();
  const upsertStock = useUpsertFeedStock();
  const [stockOpen, setStockOpen] = useState(false);
  const [stockType, setStockType] = useState("Floating Pellets");
  const [stockQty, setStockQty] = useState(50);
  const [stockCost, setStockCost] = useState(0);
  const [feedMode, setFeedMode] = useState<FeedMode>(
    () => (localStorage.getItem("fryFeedMode") as FeedMode) || "standard"
  );
  const [feedingsPerDay, setFeedingsPerDay] = useState<number>(
    () => Number(localStorage.getItem("fryFeedingsPerDay")) || 5
  );
  const setMode = (m: FeedMode) => { setFeedMode(m); localStorage.setItem("fryFeedMode", m); };
  const setFeedings = (n: number) => { setFeedingsPerDay(n); localStorage.setItem("fryFeedingsPerDay", String(n)); };

  const logs = useMemo(
    () => activeBatchId ? (allLogs ?? []).filter((l: any) => l.batch_id === activeBatchId) : allLogs,
    [allLogs, activeBatchId]
  );
  const activeBatch = batches?.find((b: any) => b.id === activeBatchId);

  const todayTotal = useMemo(
    () => logs?.filter(l => isToday(new Date(l.feeding_time))).reduce((s, l) => s + l.amount_kg, 0) ?? 0,
    [logs]
  );

  const todaysPlan = useMemo(() => {
    if (!batches) return [];
    const filtered = activeBatchId ? batches.filter((b: any) => b.id === activeBatchId) : batches;
    return filtered
      .filter((b: any) => b.status !== "harvested" && b.current_count > 0)
      .map((b: any) => {
        const target = targetDailyKg(b, feedMode, feedingsPerDay);
        const todays = allLogs?.filter(l => l.batch_id === b.id && isToday(new Date(l.feeding_time))) ?? [];
        const am = todays.find(l => new Date(l.feeding_time).getHours() < 12);
        const pm = todays.find(l => new Date(l.feeding_time).getHours() >= 12);
        return { batch: b, target, am, pm };
      });
  }, [batches, allLogs, activeBatchId, feedMode, feedingsPerDay]);


  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold font-display text-primary-foreground">Feeding</h1>
            <p className="text-xs text-primary-foreground/70 truncate">
              {activeBatch ? `Batch: ${activeBatch.name}` : "Smart feeding management"}
            </p>
          </div>
          <AddFeedingForm preselectedBatchId={activeBatchId} />
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-4">
        {activeBatchId && (
          <button onClick={() => setSearchParams({})}
            className="flex items-center gap-1 text-xs text-primary font-medium">
            <X className="w-3 h-3" /> Clear batch filter
          </button>
        )}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Utensils className="w-4 h-4" />} label="Total Fed Today" value={`${todayTotal.toFixed(1)} kg`} color="primary" />
          <StatCard icon={<TrendingDown className="w-4 h-4" />} label="Log Count" value={`${logs?.length ?? 0}`} color="teal" />
        </div>

        {/* Feed Stock */}
        <div className="bg-card rounded-2xl p-3 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Package className="w-4 h-4 text-primary" /> Feed Stock
            </h2>
            <button onClick={() => setStockOpen(o => !o)}
              className="text-[10px] text-primary font-semibold flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add / Update
            </button>
          </div>
          {(stocks?.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground">No stock recorded yet. Add stock to track usage.</p>
          ) : (
            <div className="space-y-1.5">
              {stocks!.map((s: any) => {
                const low = Number(s.quantity_kg) <= Number(s.low_threshold_kg);
                return (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{s.feed_type}</span>
                    <span className={`font-semibold ${low ? "text-danger" : "text-foreground"}`}>
                      {Number(s.quantity_kg).toFixed(1)} kg {low && "· LOW"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {stockOpen && (
            <form
              onSubmit={async (e) => { e.preventDefault(); await upsertStock.mutateAsync({ feed_type: stockType, quantity_kg: stockQty, unit_cost: stockCost }); setStockOpen(false); }}
              className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50"
            >
              <select value={stockType} onChange={e => setStockType(e.target.value)}
                className="col-span-3 bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs">
                <option>Floating Pellets</option>
                <option>Sinking Pellets</option>
                <option>Crumble</option>
                <option>Live Feed</option>
                <option>Other</option>
              </select>
              <input type="number" step="0.1" placeholder="kg" value={stockQty} onChange={e => setStockQty(Number(e.target.value))}
                className="bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs" />
              <input type="number" step="1" placeholder="TZS/kg" value={stockCost} onChange={e => setStockCost(Number(e.target.value))}
                className="bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs" />
              <button type="submit" className="bg-primary text-primary-foreground rounded-lg text-xs font-semibold">
                Save
              </button>
            </form>
          )}
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
                const target = batch ? targetDailyKg(batch, feedMode, feedingsPerDay) : 0;
                const days = batch?.stock_date ? differenceInDays(new Date(), new Date(batch.stock_date)) + 1 : 0;
                const perDaySplits = feedMode === "table" && days > 0 && days <= 21 ? feedingsPerDay : 2;
                const status = rateLog(log.amount_kg, target, perDaySplits);
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
