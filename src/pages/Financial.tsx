import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import AddFinancialForm from "@/components/forms/AddFinancialForm";
import { useFinancialRecords, useBatches } from "@/hooks/useFarm";
import { formatTZS, formatTZSCompact } from "@/lib/currency";
import UpgradeGate from "@/components/UpgradeGate";

export default function Financial() {
  return (
    <UpgradeGate feature="financial_analytics" fallbackMessage="Detailed financial analytics and P&L tracking requires the Pro plan.">
      <FinancialContent />
    </UpgradeGate>
  );
}

function FinancialContent() {
  const [activeTab, setActiveTab] = useState<"transactions" | "pnl" | "costs">("transactions");
  const { data: records, isLoading } = useFinancialRecords();
  const { data: batches } = useBatches();

  const totalRevenue = records?.filter(r => r.record_type === "revenue").reduce((s, r) => s + r.amount, 0) ?? 0;
  const totalExpense = records?.filter(r => r.record_type === "expense").reduce((s, r) => s + r.amount, 0) ?? 0;
  const netPnL = totalRevenue - totalExpense;

  // Group costs by category
  const costMap = new Map<string, number>();
  records?.filter(r => r.record_type === "expense").forEach(r => {
    costMap.set(r.category, (costMap.get(r.category) ?? 0) + r.amount);
  });
  const costBreakdown = Array.from(costMap.entries())
    .map(([category, amount]) => ({ category, amount, pct: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0 }))
    .sort((a, b) => b.amount - a.amount);

  // Batch P&L
  const batchPnL = (batches ?? []).map(b => {
    const batchRecords = records?.filter(r => r.batch_id === b.id) ?? [];
    const rev = batchRecords.filter(r => r.record_type === "revenue").reduce((s, r) => s + r.amount, 0);
    const cost = batchRecords.filter(r => r.record_type === "expense").reduce((s, r) => s + r.amount, 0);
    return { batch: b.name, species: b.species, revenue: rev, cost, pnl: rev - cost, status: b.status };
  });

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Financial Intelligence</h1>
            <p className="text-xs text-primary-foreground/70">P&L, costs & revenue tracking</p>
          </div>
          <AddFinancialForm />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-2">
            <p className="text-[10px] text-primary-foreground/70">Revenue</p>
            <p className="text-sm font-bold text-primary-foreground">{formatTZSCompact(totalRevenue)}</p>
          </div>
          <div className="flex-1 bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-2">
            <p className="text-[10px] text-primary-foreground/70">Expenses</p>
            <p className="text-sm font-bold text-primary-foreground">{formatTZSCompact(totalExpense)}</p>
          </div>
          <div className="flex-1 bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-2">
            <p className="text-[10px] text-primary-foreground/70">Net P&L</p>
            <p className={`text-sm font-bold ${netPnL >= 0 ? "text-primary-foreground" : "text-coral"}`}>
              {formatTZSCompact(netPnL)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-4">
        <div className="flex bg-muted rounded-xl p-1">
          {(["transactions", "pnl", "costs"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs font-medium py-2 rounded-lg transition capitalize ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {tab === "pnl" ? "Batch P&L" : tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <>
            {activeTab === "transactions" && (
              (records?.length ?? 0) === 0 ? (
                <div className="bg-card rounded-xl p-6 shadow-card text-center">
                  <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No transactions yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {records?.map((tx, i) => (
                    <motion.div key={tx.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        tx.record_type === "revenue" ? "bg-success-light" : "bg-coral-light"
                      }`}>
                        {tx.record_type === "revenue" ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-coral" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{tx.description ?? tx.category}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{tx.category}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">{tx.transaction_date}</span>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold flex-shrink-0 ${tx.record_type === "revenue" ? "text-success" : "text-coral"}`}>
                        {tx.record_type === "revenue" ? "+" : "-"}{formatTZS(tx.amount)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {activeTab === "pnl" && (
              batchPnL.length === 0 ? (
                <div className="bg-card rounded-xl p-6 shadow-card text-center">
                  <p className="text-sm text-muted-foreground">No batch data yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {batchPnL.map((b, i) => (
                    <motion.div key={b.batch} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-card rounded-xl p-4 shadow-card">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-foreground">{b.batch}</span>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{b.species}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          b.status === "harvested" ? "bg-success-light text-success" : "bg-ocean-surface text-primary"
                        }`}>{b.status}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Revenue</p>
                          <p className="text-sm font-semibold text-success">{formatTZSCompact(b.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Cost</p>
                          <p className="text-sm font-semibold text-coral">{formatTZSCompact(b.cost)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">P&L</p>
                          <p className={`text-sm font-semibold ${b.pnl >= 0 ? "text-success" : "text-coral"}`}>{formatTZSCompact(b.pnl)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {activeTab === "costs" && (
              costBreakdown.length === 0 ? (
                <div className="bg-card rounded-xl p-6 shadow-card text-center">
                  <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
                </div>
              ) : (
                <div className="bg-card rounded-2xl shadow-card p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Cost Breakdown</h3>
                  <div className="space-y-3">
                    {costBreakdown.map((item, i) => (
                      <motion.div key={item.category} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-foreground font-medium capitalize">{item.category}</span>
                          <span className="text-xs text-muted-foreground">{formatTZS(item.amount)} ({item.pct}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="h-full bg-primary rounded-full" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">Total</span>
                    <span className="text-sm font-bold text-foreground">{formatTZS(totalExpense)}</span>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
