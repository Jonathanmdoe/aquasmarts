import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight,
  PieChart, BarChart3, Receipt, ChevronRight
} from "lucide-react";
import StatCard from "@/components/StatCard";

const transactions = [
  { id: "1", type: "expense", category: "Feed", description: "Grower Pellet 35% - 500kg", amount: 1250, batch: "B001", date: "Today" },
  { id: "2", type: "revenue", category: "Sales", description: "Tilapia harvest - 800kg @ $4.20/kg", amount: 3360, batch: "B005", date: "Today" },
  { id: "3", type: "expense", category: "Labor", description: "Farm workers - weekly wages", amount: 850, batch: null, date: "Yesterday" },
  { id: "4", type: "expense", category: "Medication", description: "Potassium permanganate 5L", amount: 120, batch: "B001", date: "Yesterday" },
  { id: "5", type: "expense", category: "Energy", description: "Aerator electricity - monthly", amount: 420, batch: null, date: "2 days ago" },
  { id: "6", type: "revenue", category: "Sales", description: "Fingerling sales - 5000 pcs", amount: 750, batch: "B002", date: "3 days ago" },
];

const batchPnL = [
  { batch: "B001", species: "Tilapia", revenue: 0, cost: 4200, pnl: -4200, status: "Active" },
  { batch: "B003", species: "Tilapia", revenue: 0, cost: 6800, pnl: -6800, status: "Active" },
  { batch: "B005", species: "Tilapia", revenue: 14280, cost: 9800, pnl: 4480, status: "Harvested" },
  { batch: "B002", species: "Catfish", revenue: 750, cost: 1900, pnl: -1150, status: "Active" },
];

const costBreakdown = [
  { category: "Feed", amount: 12400, pct: 58 },
  { category: "Labor", amount: 3400, pct: 16 },
  { category: "Energy", amount: 2520, pct: 12 },
  { category: "Fingerlings", amount: 1800, pct: 8 },
  { category: "Medication", amount: 680, pct: 3 },
  { category: "Other", amount: 600, pct: 3 },
];

export default function Financial() {
  const [activeTab, setActiveTab] = useState<"transactions" | "pnl" | "costs">("transactions");
  const totalRevenue = 18390;
  const totalExpense = 21400;

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Financial Intelligence</h1>
            <p className="text-xs text-primary-foreground/70">P&L, costs & revenue tracking</p>
          </div>
          <button className="w-10 h-10 rounded-xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
        {/* Summary cards */}
        <div className="flex gap-2">
          <div className="flex-1 bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-2">
            <p className="text-[10px] text-primary-foreground/70">Revenue</p>
            <p className="text-sm font-bold text-primary-foreground">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="flex-1 bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-2">
            <p className="text-[10px] text-primary-foreground/70">Expenses</p>
            <p className="text-sm font-bold text-primary-foreground">${totalExpense.toLocaleString()}</p>
          </div>
          <div className="flex-1 bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-2">
            <p className="text-[10px] text-primary-foreground/70">Net P&L</p>
            <p className={`text-sm font-bold ${totalRevenue - totalExpense >= 0 ? "text-primary-foreground" : "text-coral"}`}>
              ${(totalRevenue - totalExpense).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-4">
        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1">
          {(["transactions", "pnl", "costs"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs font-medium py-2 rounded-lg transition capitalize ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {tab === "pnl" ? "Batch P&L" : tab}
            </button>
          ))}
        </div>

        {activeTab === "transactions" && (
          <div className="space-y-2">
            {transactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  tx.type === "revenue" ? "bg-success-light" : "bg-coral-light"
                }`}>
                  {tx.type === "revenue" ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-coral" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{tx.category}</span>
                    {tx.batch && <><span className="text-[10px] text-muted-foreground">·</span><span className="text-[10px] text-muted-foreground">{tx.batch}</span></>}
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{tx.date}</span>
                  </div>
                </div>
                <span className={`text-sm font-semibold flex-shrink-0 ${tx.type === "revenue" ? "text-success" : "text-coral"}`}>
                  {tx.type === "revenue" ? "+" : "-"}${tx.amount.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "pnl" && (
          <div className="space-y-2">
            {batchPnL.map((b, i) => (
              <motion.div
                key={b.batch}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl p-4 shadow-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{b.batch}</span>
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{b.species}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      b.status === "Harvested" ? "bg-success-light text-success" : "bg-ocean-surface text-primary"
                    }`}>{b.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Revenue</p>
                    <p className="text-sm font-semibold text-success">${b.revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Cost</p>
                    <p className="text-sm font-semibold text-coral">${b.cost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">P&L</p>
                    <p className={`text-sm font-semibold ${b.pnl >= 0 ? "text-success" : "text-coral"}`}>${b.pnl.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "costs" && (
          <div className="bg-card rounded-2xl shadow-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Cost Breakdown (This Month)</h3>
            <div className="space-y-3">
              {costBreakdown.map((item, i) => (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground font-medium">{item.category}</span>
                    <span className="text-xs text-muted-foreground">${item.amount.toLocaleString()} ({item.pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Total</span>
              <span className="text-sm font-bold text-foreground">${costBreakdown.reduce((a, b) => a + b.amount, 0).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
