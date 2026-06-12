import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, ArrowUpRight, ArrowDownRight, AlertTriangle, TrendingUp,
  TrendingDown, Calendar, FileText, Receipt, CreditCard, Calculator,
  Plus, Brain, CheckCircle2, Clock, X, Link2, Download, RefreshCw,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useFinancialRecords, useBatches } from "@/hooks/useFarm";
import { useInvoices, useLoans, useAddInvoice, useUpdateInvoice, useAddLoan, useRecordLoanPayment } from "@/hooks/useFinance";
import { useAddFinancialRecord } from "@/hooks/useMutations";
import { formatTZS, formatTZSCompact } from "@/lib/currency";
import UpgradeGate from "@/components/UpgradeGate";
import { AIAdvisorButton } from "@/components/finance/AIAdvisor";

const COUNTRIES = [
  { code: "TZ", name: "Tanzania", vat: 18, income: 30 },
  { code: "KE", name: "Kenya", vat: 16, income: 30 },
  { code: "NG", name: "Nigeria", vat: 7.5, income: 30 },
  { code: "GH", name: "Ghana", vat: 15, income: 25 },
  { code: "EG", name: "Egypt", vat: 14, income: 22.5 },
  { code: "VN", name: "Vietnam", vat: 10, income: 20 },
  { code: "IN", name: "India", vat: 5, income: 22 },
  { code: "NO", name: "Norway", vat: 25, income: 22 },
  { code: "US", name: "United States", vat: 0, income: 21 },
];
const COST_CATEGORIES = ["feed", "labor", "equipment", "medication", "transport", "other"];
const BENCHMARK_MARGIN = 35;

export default function Financial() {
  return (
    <UpgradeGate feature="financial_analytics" fallbackMessage="Detailed financial analytics requires the Pro plan.">
      <FinancialContent />
    </UpgradeGate>
  );
}

type Tab = "overview" | "ai" | "pnl" | "costs" | "ledger" | "integrations";

function FinancialContent() {
  const [tab, setTab] = useState<Tab>("overview");
  const { data: records = [], isLoading } = useFinancialRecords();
  const { data: batches = [] } = useBatches();

  const m = useMemo(() => computeMetrics(records as any[], batches as any[]), [records, batches]);
  const alerts = useMemo(() => computeAlerts(m, batches as any[]), [m, batches]);

  const monthLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen pb-6">
      {/* HEADER */}
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Finance Intelligence</h1>
            <p className="text-[11px] text-primary-foreground/80">
              {monthLabel} · {batches.length} batches · {records.length} txns
              {alerts.length > 0 && <span className="ml-2">⚠️ {alerts.length} alert{alerts.length > 1 ? "s" : ""}</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <QuickTxButton type="revenue" label="+ Income" />
            <QuickTxButton type="expense" label="+ Cost" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Kpi label="Revenue" value={formatTZSCompact(m.revenue)} />
          <Kpi label="Expenses" value={formatTZSCompact(m.expense)} />
          <Kpi label="Net P&L" value={formatTZSCompact(m.net)} highlight={m.net < 0} />
        </div>
      </div>

      {/* TABS */}
      <div className="px-3 -mt-3 relative z-10">
        <div className="bg-card rounded-2xl p-1 shadow-card flex overflow-x-auto no-scrollbar">
          {([
            ["overview", "📊 Overview"],
            ["ai", "🧠 AI"],
            ["pnl", "📈 P&L"],
            ["costs", "💸 Costs"],
            ["ledger", "📒 Ledger"],
            ["integrations", "🔗 Sync"],
          ] as [Tab, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 whitespace-nowrap text-[11px] font-semibold py-2.5 px-3 rounded-xl transition ${
                tab === k ? "gradient-ocean text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {isLoading ? (
          <Loader />
        ) : (
          <>
            {tab === "overview" && <OverviewTab m={m} alerts={alerts} records={records as any[]} batches={batches as any[]} />}
            {tab === "ai" && <AITab m={m} records={records as any[]} batches={batches as any[]} alerts={alerts} />}
            {tab === "pnl" && <PnLTab m={m} batches={batches as any[]} />}
            {tab === "costs" && <CostsTab m={m} records={records as any[]} />}
            {tab === "ledger" && <LedgerTab records={records as any[]} batches={batches as any[]} />}
            {tab === "integrations" && <IntegrationsTab />}
          </>
        )}
      </div>
    </div>
  );
}

/* ============ METRICS ============ */
function computeMetrics(records: any[], batches: any[]) {
  const revenue = records.filter(r => r.record_type === "revenue").reduce((s, r) => s + Number(r.amount), 0);
  const expense = records.filter(r => r.record_type === "expense").reduce((s, r) => s + Number(r.amount), 0);
  const net = revenue - expense;
  const margin = revenue > 0 ? (net / revenue) * 100 : 0;

  // by month
  const months = new Map<string, { revenue: number; expense: number }>();
  records.forEach(r => {
    const d = new Date(r.transaction_date);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = months.get(k) ?? { revenue: 0, expense: 0 };
    if (r.record_type === "revenue") cur.revenue += Number(r.amount);
    else cur.expense += Number(r.amount);
    months.set(k, cur);
  });
  const monthly = Array.from(months.entries())
    .sort()
    .slice(-6)
    .map(([k, v]) => ({
      month: new Date(k + "-01").toLocaleString("en-US", { month: "short" }),
      revenue: v.revenue,
      expense: v.expense,
      net: v.revenue - v.expense,
    }));

  // by category
  const catMap = new Map<string, number>();
  records.filter(r => r.record_type === "expense").forEach(r => {
    catMap.set(r.category, (catMap.get(r.category) ?? 0) + Number(r.amount));
  });
  const byCategory = COST_CATEGORIES.map(c => ({
    category: c,
    amount: catMap.get(c) ?? 0,
    pct: expense > 0 ? Math.round(((catMap.get(c) ?? 0) / expense) * 100) : 0,
  })).filter(c => c.amount > 0 || COST_CATEGORIES.includes(c.category));

  // batch P&L
  const batchPnL = batches.map(b => {
    const rs = records.filter(r => r.batch_id === b.id);
    const rev = rs.filter(r => r.record_type === "revenue").reduce((s, r) => s + Number(r.amount), 0);
    const cost = rs.filter(r => r.record_type === "expense").reduce((s, r) => s + Number(r.amount), 0);
    return { id: b.id, name: b.name, species: b.species, status: b.status, revenue: rev, cost, pnl: rev - cost };
  });

  // anomalies (current vs prior month per category)
  const now = new Date();
  const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const catByMonth = new Map<string, Map<string, number>>();
  records.filter(r => r.record_type === "expense").forEach(r => {
    const d = new Date(r.transaction_date);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!catByMonth.has(k)) catByMonth.set(k, new Map());
    const cm = catByMonth.get(k)!;
    cm.set(r.category, (cm.get(r.category) ?? 0) + Number(r.amount));
  });
  const cur = catByMonth.get(curKey) ?? new Map();
  const prev = catByMonth.get(prevKey) ?? new Map();
  const anomalies: { category: string; current: number; previous: number; change: number }[] = [];
  for (const [cat, amt] of cur.entries()) {
    const p = prev.get(cat) ?? 0;
    if (p > 0 && amt > p * 1.3) {
      anomalies.push({ category: cat, current: amt, previous: p, change: Math.round(((amt - p) / p) * 100) });
    } else if (p === 0 && amt > 50000) {
      anomalies.push({ category: cat, current: amt, previous: 0, change: 100 });
    }
  }

  // 3-month averages
  const last3 = monthly.slice(-3);
  const avgRevenue = last3.length ? last3.reduce((s, x) => s + x.revenue, 0) / last3.length : 0;
  const avgExpense = last3.length ? last3.reduce((s, x) => s + x.expense, 0) / last3.length : 0;

  // budget (avg per category × 1.15)
  const budgetByCategory = COST_CATEGORIES.map(c => {
    const totals = last3.map(_ => 0); // placeholder
    const catTotal3 = records.filter(r =>
      r.record_type === "expense" && r.category === c &&
      monthsAgo(r.transaction_date) <= 3
    ).reduce((s, r) => s + Number(r.amount), 0);
    const monthlyAvg = catTotal3 / 3;
    return { category: c, budget: Math.round(monthlyAvg * 1.15), spent: catMap.get(c) ?? 0 };
  });

  return { revenue, expense, net, margin, monthly, byCategory, batchPnL, anomalies, avgRevenue, avgExpense, budgetByCategory };
}

function monthsAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

function computeAlerts(m: ReturnType<typeof computeMetrics>, batches: any[]) {
  const alerts: { type: "danger" | "warning" | "success"; title: string; body: string }[] = [];
  if (m.revenue > 0 && m.margin < BENCHMARK_MARGIN) {
    alerts.push({ type: "warning", title: "Profit margin below target",
      body: `Current margin ${m.margin.toFixed(1)}% vs ${BENCHMARK_MARGIN}% aquaculture benchmark.` });
  }
  const equipSpike = m.anomalies.find(a => a.category === "equipment");
  if (equipSpike) {
    alerts.push({ type: "danger", title: "Equipment cost spike",
      body: `Equipment spending up ${equipSpike.change}% vs last month (${formatTZSCompact(equipSpike.current)}).` });
  }
  // harvest-ready delay
  const ready = batches.filter(b => b.status === "growing" && b.avg_weight && Number(b.avg_weight) > 400);
  ready.forEach(b => {
    alerts.push({ type: "warning", title: `${b.name} ready to harvest`,
      body: `Delay cost ~${formatTZSCompact(120 * 2300)}/week in feed waste.` });
  });
  // cash surplus
  const projected = m.avgRevenue - m.avgExpense;
  if (projected > 0) {
    alerts.push({ type: "success", title: "Cash surplus projected",
      body: `Next 30 days: ${formatTZSCompact(projected)} available to reinvest.` });
  }
  return alerts;
}

/* ============ COMPONENTS ============ */
function Kpi({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-2">
      <p className="text-[10px] text-primary-foreground/80">{label}</p>
      <p className={`text-sm font-bold ${highlight ? "text-coral" : "text-primary-foreground"}`}>{value}</p>
    </div>
  );
}

function Loader() {
  return <div className="text-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;
}

function QuickTxButton({ type, label }: { type: "revenue" | "expense"; label: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState(type === "revenue" ? "fish_sales" : "feed");
  const [batchId, setBatchId] = useState("");
  const { data: batches = [] } = useBatches();
  const mut = useAddFinancialRecord();
  const cats = type === "revenue" ? ["fish_sales", "fingerling_sales", "other"] : COST_CATEGORIES;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mut.mutateAsync({
      record_type: type, category, amount: Number(amount),
      description: desc, batch_id: batchId || undefined,
      transaction_date: new Date().toISOString().split("T")[0],
    });
    setOpen(false); setAmount(""); setDesc("");
  };
  const f = "w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm outline-none";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-primary-foreground/20 text-primary-foreground backdrop-blur">
          {label}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Add {type === "revenue" ? "Income" : "Expense"}</SheetTitle></SheetHeader>
        <form onSubmit={submit} className="space-y-3 mt-4">
          <div>
            <label className="text-xs text-muted-foreground">Amount (TZS) *</label>
            <input type="number" required min={1} value={amount} onChange={e => setAmount(e.target.value)} className={f} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={f}>
              {cats.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} className={f} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Linked batch</label>
            <select value={batchId} onChange={e => setBatchId(e.target.value)} className={f}>
              <option value="">None</option>
              {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={mut.isPending} className="w-full gradient-ocean text-primary-foreground font-semibold py-3 rounded-xl text-sm">
            {mut.isPending ? "Saving…" : "Save"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ============ TABS ============ */
function OverviewTab({ m, alerts, records, batches }: any) {
  return (
    <div className="space-y-4">
      {/* alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-xl p-3 flex gap-3 ${
                a.type === "danger" ? "bg-coral-light border border-coral/30" :
                a.type === "warning" ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-300/40" :
                "bg-success-light border border-success/30"
              }`}>
              <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${
                a.type === "danger" ? "bg-coral/20 text-coral" :
                a.type === "warning" ? "bg-amber-200/60 text-amber-700 dark:text-amber-300" :
                "bg-success/20 text-success"
              }`}>
                {a.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{a.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{a.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Net hero */}
      <div className={`rounded-2xl p-5 shadow-card ${m.net < 0 ? "bg-coral-light" : "gradient-ocean"}`}>
        <p className={`text-xs ${m.net < 0 ? "text-coral" : "text-primary-foreground/80"}`}>Net Profit</p>
        <p className={`text-3xl font-bold mt-1 ${m.net < 0 ? "text-coral" : "text-primary-foreground"}`}>
          {formatTZS(m.net)}
        </p>
        <p className={`text-[11px] mt-1 ${m.net < 0 ? "text-coral/80" : "text-primary-foreground/70"}`}>
          Margin {m.margin.toFixed(1)}% · target {BENCHMARK_MARGIN}%
        </p>
      </div>

      {/* Monthly chart */}
      {m.monthly.length > 0 && (
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Revenue vs Costs (last 6 months)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={m.monthly}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatTZSCompact(v)} />
              <Tooltip formatter={(v: any) => formatTZS(v)} />
              <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="hsl(var(--coral))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI teaser */}
      <AIAdvisorButton mode="full_analysis" label="Get Full AI Analysis"
        context={{ revenue: m.revenue, expense: m.expense, net: m.net, margin: m.margin, monthly: m.monthly, byCategory: m.byCategory, batchPnL: m.batchPnL, anomalies: m.anomalies }} />

      {/* Tool shortcuts */}
      <div className="grid grid-cols-2 gap-2">
        <BudgetSheet m={m} records={records} />
        <CashFlowSheet m={m} batches={batches} />
        <InvoiceSheet />
        <TaxSheet m={m} />
        <LoansSheet m={m} />
      </div>

      {/* Batch P&L */}
      {m.batchPnL.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Batch P&L</h3>
          {m.batchPnL.slice(0, 3).map((b: any) => (
            <div key={b.id} className="bg-card rounded-xl p-3 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold">{b.name}</span>
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{b.species}</span>
              </div>
              <div className="grid grid-cols-3 text-center gap-2">
                <div><p className="text-[10px] text-muted-foreground">Revenue</p><p className="text-xs font-semibold text-success">{formatTZSCompact(b.revenue)}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Cost</p><p className="text-xs font-semibold text-coral">{formatTZSCompact(b.cost)}</p></div>
                <div><p className="text-[10px] text-muted-foreground">P&L</p><p className={`text-xs font-semibold ${b.pnl >= 0 ? "text-success" : "text-coral"}`}>{formatTZSCompact(b.pnl)}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AITab({ m, records, batches, alerts }: any) {
  const [question, setQuestion] = useState("");
  const chips = [
    "How can I improve my profit margin?",
    "What's my biggest cost risk this month?",
    "Should I harvest now or wait?",
    "Can I afford a new loan?",
    "Which batch is most profitable?",
    "Where can I cut 10% spend safely?",
  ];
  const ctx = { revenue: m.revenue, expense: m.expense, net: m.net, margin: m.margin, monthly: m.monthly, byCategory: m.byCategory, batchPnL: m.batchPnL, anomalies: m.anomalies, alerts };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl p-5 shadow-card text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl gradient-ocean flex items-center justify-center mb-3">
          <Brain className="w-6 h-6 text-primary-foreground" />
        </div>
        <h2 className="text-base font-bold text-foreground">Full Farm AI Analysis</h2>
        <p className="text-xs text-muted-foreground mb-4">Sends every real transaction, batch P&L, monthly trend and anomaly to AI. Streams a graded report.</p>
        <AIAdvisorButton mode="full_analysis" label="Run Full Analysis" context={ctx} />
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Quick questions (real data attached)</p>
        <div className="flex flex-wrap gap-2">
          {chips.map(c => (
            <AIAdvisorButton key={c} mode="question" question={c} label={c} context={ctx} compact />
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card">
        <p className="text-xs font-medium text-muted-foreground mb-2">Ask anything</p>
        <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={3}
          placeholder="e.g. Is my feed cost too high compared to revenue?"
          className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm outline-none mb-2" />
        {question.trim() && (
          <AIAdvisorButton mode="question" question={question} label="Ask AI" context={ctx} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          ["Health Grade", "A–F score"],
          ["Cost Anomalies", "Spike detection"],
          ["Batch Viability", "Per-batch ROI"],
          ["Loss Prediction", "Forecast risks"],
          ["Cash Forecast", "30-day outlook"],
          ["Scale Advice", "Grow safely"],
        ].map(([t, d]) => (
          <div key={t} className="bg-card rounded-xl p-3 shadow-card">
            <p className="text-xs font-semibold">{t}</p>
            <p className="text-[10px] text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PnLTab({ m, batches }: any) {
  const ctx = { revenue: m.revenue, byCategory: m.byCategory, net: m.net, margin: m.margin, batchPnL: m.batchPnL };
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Income Statement</h3>
        <Row label="Revenue" value={m.revenue} bold />
        <div className="border-t border-border my-2" />
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-2 mb-1">Expenses</p>
        {m.byCategory.map((c: any) => (
          <Row key={c.category} label={c.category} value={c.amount} negative />
        ))}
        <Row label="Total Expenses" value={m.expense} bold negative />
        <div className="border-t-2 border-border my-2" />
        <Row label="Net Profit" value={m.net} bold negative={m.net < 0} />
        <p className="text-[11px] text-muted-foreground mt-1">Margin: {m.margin.toFixed(1)}%</p>
      </div>

      <AIAdvisorButton mode="pnl_analysis" label="Get AI P&L Recommendations" context={ctx} />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Per-Batch P&L</h3>
        {m.batchPnL.map((b: any) => (
          <div key={b.id} className="bg-card rounded-xl p-3 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{b.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.status === "harvested" ? "bg-success-light text-success" : "bg-ocean-surface text-primary"}`}>{b.status}</span>
              </div>
              <span className={`text-sm font-bold ${b.pnl >= 0 ? "text-success" : "text-coral"}`}>{formatTZSCompact(b.pnl)}</span>
            </div>
            <div className="grid grid-cols-2 text-center gap-2">
              <div><p className="text-[10px] text-muted-foreground">Revenue</p><p className="text-xs font-semibold text-success">{formatTZSCompact(b.revenue)}</p></div>
              <div><p className="text-[10px] text-muted-foreground">Cost</p><p className="text-xs font-semibold text-coral">{formatTZSCompact(b.cost)}</p></div>
            </div>
          </div>
        ))}
        {m.batchPnL.length === 0 && <Empty text="No batches yet." />}
      </div>
    </div>
  );
}

function Row({ label, value, bold, negative }: { label: string; value: number; bold?: boolean; negative?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${bold ? "font-semibold" : ""}`}>
      <span className={`text-sm capitalize ${bold ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm ${negative ? "text-coral" : "text-foreground"}`}>{negative && value > 0 ? "-" : ""}{formatTZS(Math.abs(value))}</span>
    </div>
  );
}

function CostsTab({ m, records }: any) {
  const ctx = { byCategory: m.byCategory, expense: m.expense, anomalies: m.anomalies };
  const benchmarks = [
    { label: "Feed cost / kg", value: "~TZS 1,800", target: "<TZS 2,000" },
    { label: "Labor / kg", value: "~TZS 350", target: "<TZS 500" },
    { label: "FCR", value: "1.6", target: "1.5-1.8" },
    { label: "Mortality", value: "8%", target: "<10%" },
  ];
  return (
    <div className="space-y-4">
      {m.anomalies.length > 0 && (
        <div className="bg-coral-light border border-coral/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-coral" />
            <p className="text-sm font-bold text-foreground">Auto-Detected Anomalies</p>
          </div>
          {m.anomalies.map((a: any) => (
            <p key={a.category} className="text-xs text-foreground capitalize mb-0.5">
              {a.category}: <span className="font-semibold">{formatTZSCompact(a.current)}</span> · +{a.change}% vs last month
            </p>
          ))}
        </div>
      )}

      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Cost Breakdown</h3>
        {m.byCategory.map((c: any) => (
          <div key={c.category} className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-xs capitalize font-medium">{c.category}</span>
              <span className="text-xs text-muted-foreground">{formatTZS(c.amount)} ({c.pct}%)</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${c.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      <AIAdvisorButton mode="cost_reduction" label="AI Cost Reduction Advice" context={ctx} />

      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Industry Benchmarks</h3>
        <div className="grid grid-cols-2 gap-3">
          {benchmarks.map(b => (
            <div key={b.label} className="bg-muted/50 rounded-xl p-2">
              <p className="text-[10px] text-muted-foreground">{b.label}</p>
              <p className="text-sm font-semibold">{b.value}</p>
              <p className="text-[10px] text-success">Target: {b.target}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LedgerTab({ records, batches }: any) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? records : records.filter((r: any) => r.batch_id === filter);
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <Chip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
        {batches.map((b: any) => (
          <Chip key={b.id} label={b.name} active={filter === b.id} onClick={() => setFilter(b.id)} />
        ))}
      </div>
      {filtered.length === 0 ? <Empty text="No transactions." /> :
        <div className="space-y-2">
          {filtered.map((tx: any) => (
            <div key={tx.id} className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${tx.record_type === "revenue" ? "bg-success-light" : "bg-coral-light"}`}>
                {tx.record_type === "revenue" ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-coral" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.description ?? tx.category}</p>
                <p className="text-[10px] text-muted-foreground">{tx.category} · {tx.transaction_date} · <span className="text-amber-600">Pending sync</span></p>
              </div>
              <span className={`text-sm font-semibold ${tx.record_type === "revenue" ? "text-success" : "text-coral"}`}>
                {tx.record_type === "revenue" ? "+" : "-"}{formatTZS(Number(tx.amount))}
              </span>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

function Chip({ label, active, onClick }: any) {
  return <button onClick={onClick} className={`text-[11px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${active ? "gradient-ocean text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{label}</button>;
}

function IntegrationsTab() {
  const { toast } = useToastSafe();
  const sync = (svc: string) => toast(`${svc} sync started (mock)`);
  return (
    <div className="space-y-3">
      {["Zoho Books", "QuickBooks"].map(svc => (
        <div key={svc} className="bg-card rounded-2xl p-4 shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{svc}</p>
              <p className="text-[11px] text-muted-foreground">Last sync: never</p>
            </div>
          </div>
          <button onClick={() => sync(svc)} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">
            <RefreshCw className="w-3 h-3" /> Sync
          </button>
        </div>
      ))}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <p className="text-sm font-semibold mb-3">Sync preferences</p>
        {["Auto-sync transactions", "Sync invoices", "Sync expenses", "Sync batch P&L", "Daily summary email"].map(p => (
          <label key={p} className="flex items-center justify-between py-2">
            <span className="text-xs">{p}</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </label>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {["CSV Export", "PDF Report", "Tax Report", "Batch Report"].map(e => (
          <button key={e} onClick={() => sync(e)} className="bg-card rounded-xl p-3 shadow-card flex items-center justify-center gap-2 text-xs font-medium">
            <Download className="w-3.5 h-3.5" /> {e}
          </button>
        ))}
      </div>
    </div>
  );
}

function useToastSafe() {
  const { toast } = require("@/hooks/use-toast").useToast();
  return { toast: (msg: string) => toast({ title: msg }) };
}

function Empty({ text }: { text: string }) {
  return <div className="bg-card rounded-xl p-6 shadow-card text-center text-sm text-muted-foreground">{text}</div>;
}

/* ============ FINANCE TOOL SHEETS ============ */
function ToolButton({ icon: Icon, label, color }: any) {
  return (
    <div className="bg-card rounded-xl p-3 shadow-card flex flex-col items-center gap-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[11px] font-medium text-center">{label}</span>
    </div>
  );
}

function BudgetSheet({ m, records }: any) {
  const [open, setOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const getBudget = (c: string) => overrides[c] ?? (m.budgetByCategory.find((x: any) => x.category === c)?.budget ?? 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><button className="text-left"><ToolButton icon={Calendar} label="Smart Budget" color="bg-primary/10 text-primary" /></button></SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Smart Budget Planner</SheetTitle></SheetHeader>
        <p className="text-[11px] text-muted-foreground mt-1">Limits auto-set from your 3-month actual spending +15% buffer.</p>
        <div className="space-y-3 mt-4">
          {m.budgetByCategory.map((b: any) => {
            const budget = getBudget(b.category);
            const pct = budget > 0 ? Math.min(100, (b.spent / budget) * 100) : 0;
            const over = b.spent > budget && budget > 0;
            return (
              <div key={b.category} className="bg-muted/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium capitalize">{b.category}</span>
                  <input type="number" value={budget} onChange={e => setOverrides({ ...overrides, [b.category]: Number(e.target.value) })}
                    className="w-24 text-xs text-right bg-card border border-border rounded px-2 py-0.5" />
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
                  <div className={`h-full rounded-full transition-all ${over ? "bg-coral" : pct > 80 ? "bg-amber-500" : "bg-success"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground">Spent {formatTZSCompact(b.spent)} / {formatTZSCompact(budget)} {over && <span className="text-coral font-semibold">· Over by {formatTZSCompact(b.spent - budget)}</span>}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <AIAdvisorButton mode="budget" label="AI Budget Analysis" context={{ budget: m.budgetByCategory, overrides, byCategory: m.byCategory }} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CashFlowSheet({ m, batches }: any) {
  const [open, setOpen] = useState(false);
  const [horizon, setHorizon] = useState(30);
  const months = horizon / 30;
  const inflow = m.avgRevenue * months;
  const outflow = m.avgExpense * months;
  const surplus = inflow - outflow;
  const chartData = Array.from({ length: Math.round(months) }, (_, i) => ({
    period: `M${i + 1}`, inflow: m.avgRevenue, outflow: m.avgExpense,
  }));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><button className="text-left"><ToolButton icon={TrendingUp} label="Cash Flow" color="bg-blue-500/10 text-blue-500" /></button></SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Smart Cash Flow Forecast</SheetTitle></SheetHeader>
        <div className="flex gap-2 mt-3">
          {[30, 60, 90].map(d => (
            <button key={d} onClick={() => setHorizon(d)} className={`flex-1 text-xs py-2 rounded-lg ${horizon === d ? "gradient-ocean text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{d} days</button>
          ))}
        </div>
        <div className={`mt-4 rounded-2xl p-4 ${surplus >= 0 ? "gradient-ocean" : "bg-coral-light"}`}>
          <p className={`text-xs ${surplus >= 0 ? "text-primary-foreground/80" : "text-coral"}`}>Projected Net</p>
          <p className={`text-2xl font-bold ${surplus >= 0 ? "text-primary-foreground" : "text-coral"}`}>{formatTZS(surplus)}</p>
          <p className={`text-[10px] mt-0.5 ${surplus >= 0 ? "text-primary-foreground/70" : "text-coral/80"}`}>Inflow {formatTZSCompact(inflow)} · Outflow {formatTZSCompact(outflow)}</p>
        </div>
        {chartData.length > 0 && (
          <div className="mt-4 bg-card rounded-2xl p-3 shadow-card">
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatTZSCompact(v)} />
                <Tooltip formatter={(v: any) => formatTZS(v)} />
                <Line type="monotone" dataKey="inflow" stroke="hsl(var(--success))" />
                <Line type="monotone" dataKey="outflow" stroke="hsl(var(--coral))" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-4">
          <AIAdvisorButton mode="cash_flow" label="AI Cash Flow Advice" context={{ horizon, inflow, outflow, surplus, avgRevenue: m.avgRevenue, avgExpense: m.avgExpense, batches: batches.map((b: any) => ({ name: b.name, status: b.status, stock_date: b.stock_date })) }} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InvoiceSheet() {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const { data: invoices = [] } = useInvoices();
  const { data: batches = [] } = useBatches();
  const add = useAddInvoice();
  const upd = useUpdateInvoice();
  const [form, setForm] = useState({ buyer_name: "", item: "", amount: "", due_date: "", batch_id: "" });
  const f = "w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm outline-none";

  const collected = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.amount), 0);
  const pending = invoices.filter((i: any) => i.status === "pending").reduce((s: number, i: any) => s + Number(i.amount), 0);
  const overdue = invoices.filter((i: any) => {
    return i.status !== "paid" && new Date(i.due_date) < new Date();
  }).reduce((s: number, i: any) => s + Number(i.amount), 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await add.mutateAsync({ ...form, amount: Number(form.amount), batch_id: form.batch_id || undefined });
    setForm({ buyer_name: "", item: "", amount: "", due_date: "", batch_id: "" });
    setCreating(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><button className="text-left"><ToolButton icon={FileText} label="Invoices" color="bg-amber-500/10 text-amber-600" /></button></SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Invoice Manager</SheetTitle></SheetHeader>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-success-light rounded-xl p-2 text-center"><p className="text-[10px] text-success">Collected</p><p className="text-xs font-bold text-success">{formatTZSCompact(collected)}</p></div>
          <div className="bg-amber-100/40 rounded-xl p-2 text-center"><p className="text-[10px] text-amber-700">Pending</p><p className="text-xs font-bold text-amber-700">{formatTZSCompact(pending)}</p></div>
          <div className="bg-coral-light rounded-xl p-2 text-center"><p className="text-[10px] text-coral">Overdue</p><p className="text-xs font-bold text-coral">{formatTZSCompact(overdue)}</p></div>
        </div>

        <button onClick={() => setCreating(!creating)} className="mt-3 w-full text-xs font-semibold py-2 rounded-xl gradient-ocean text-primary-foreground">
          {creating ? "Close" : "+ Create Invoice"}
        </button>

        {creating && (
          <form onSubmit={submit} className="space-y-2 mt-3 bg-muted/30 rounded-xl p-3">
            <input required placeholder="Buyer name" value={form.buyer_name} onChange={e => setForm({ ...form, buyer_name: e.target.value })} className={f} />
            <input required placeholder="Item / description" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} className={f} />
            <input required type="number" min={1} placeholder="Amount TZS" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={f} />
            <input required type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className={f} />
            <select value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })} className={f}>
              <option value="">No batch</option>
              {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button type="submit" disabled={add.isPending} className="w-full text-xs font-semibold py-2 rounded-xl bg-primary text-primary-foreground">{add.isPending ? "Saving…" : "Save Invoice"}</button>
          </form>
        )}

        <div className="space-y-2 mt-4">
          {invoices.length === 0 ? <Empty text="No invoices yet." /> :
            invoices.map((inv: any) => {
              const isOverdue = inv.status !== "paid" && new Date(inv.due_date) < new Date();
              const status = isOverdue ? "overdue" : inv.status;
              return (
                <div key={inv.id} className="bg-card rounded-xl p-3 shadow-card">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold">{inv.buyer_name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      status === "paid" ? "bg-success-light text-success" :
                      status === "overdue" ? "bg-coral-light text-coral" :
                      "bg-amber-100/60 text-amber-700"
                    }`}>{status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{inv.item}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold">{formatTZS(Number(inv.amount))}</span>
                    <span className="text-[10px] text-muted-foreground">Due {inv.due_date}</span>
                  </div>
                  {inv.status !== "paid" && (
                    <button onClick={() => upd.mutate({ id: inv.id, status: "paid" })}
                      className="mt-2 w-full text-[11px] font-medium py-1.5 rounded-lg bg-success/10 text-success">Mark Paid</button>
                  )}
                </div>
              );
            })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TaxSheet({ m }: any) {
  const [open, setOpen] = useState(false);
  const [countryCode, setCountryCode] = useState("TZ");
  const country = COUNTRIES.find(c => c.code === countryCode)!;
  const vatOutput = m.revenue * (country.vat / 100);
  const vatInput = m.expense * (country.vat / 100) * 0.6;
  const vatOwed = Math.max(0, vatOutput - vatInput);
  const taxable = Math.max(0, m.net);
  const incomeTax = taxable * (country.income / 100);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><button className="text-left"><ToolButton icon={Calculator} label="Tax" color="bg-purple-500/10 text-purple-500" /></button></SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Smart Tax Summary</SheetTitle></SheetHeader>
        <div className="mt-3">
          <label className="text-xs text-muted-foreground">Country</label>
          <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm">
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.vat}% VAT · {c.income}% income)</option>)}
          </select>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card mt-3">
          <h3 className="text-sm font-semibold mb-2">VAT Summary ({country.vat}%)</h3>
          <Row label="Output VAT" value={vatOutput} />
          <Row label="Input VAT" value={vatInput} negative />
          <div className="border-t border-border my-1" />
          <Row label="Net Owed" value={vatOwed} bold />
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card mt-3">
          <h3 className="text-sm font-semibold mb-2">Income Tax ({country.income}%)</h3>
          <Row label="Taxable Income" value={taxable} />
          <Row label="Estimated Tax" value={incomeTax} bold negative />
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card mt-3">
          <h3 className="text-sm font-semibold mb-2">Deductible Expenses</h3>
          {m.byCategory.map((c: any) => <Row key={c.category} label={c.category} value={c.amount} />)}
        </div>
        <div className="mt-4">
          <AIAdvisorButton mode="tax" label="AI Tax Advice"
            question={`Country: ${country.name}`}
            context={{ country: country.name, vatRate: country.vat, incomeTaxRate: country.income, vatOwed, incomeTax, revenue: m.revenue, expense: m.expense, byCategory: m.byCategory }} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LoansSheet({ m }: any) {
  const [open, setOpen] = useState(false);
  const { data: loans = [] } = useLoans();
  const add = useAddLoan();
  const pay = useRecordLoanPayment();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ lender: "", purpose: "", principal: "", interest_rate: "", monthly_installment: "", term_months: "" });
  const f = "w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm outline-none";

  const totalOwed = loans.reduce((s: number, l: any) => s + Number(l.remaining_balance), 0);
  const monthlyDue = loans.filter((l: any) => l.status === "active").reduce((s: number, l: any) => s + Number(l.monthly_installment), 0);
  const dti = m.avgRevenue > 0 ? (monthlyDue / m.avgRevenue) * 100 : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await add.mutateAsync({
      lender: form.lender, purpose: form.purpose,
      principal: Number(form.principal), interest_rate: Number(form.interest_rate || 0),
      monthly_installment: Number(form.monthly_installment), term_months: Number(form.term_months),
    });
    setForm({ lender: "", purpose: "", principal: "", interest_rate: "", monthly_installment: "", term_months: "" });
    setCreating(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><button className="text-left"><ToolButton icon={CreditCard} label="Loans" color="bg-coral-light text-coral" /></button></SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Loans & Credit</SheetTitle>
        </SheetHeader>
        <p className={`text-[11px] mt-1 ${dti > 30 ? "text-coral font-semibold" : "text-muted-foreground"}`}>
          Debt-to-income: {dti.toFixed(1)}%{dti > 30 ? " (high)" : ""}
        </p>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-muted/40 rounded-xl p-2 text-center"><p className="text-[10px] text-muted-foreground">Owed</p><p className="text-xs font-bold">{formatTZSCompact(totalOwed)}</p></div>
          <div className="bg-muted/40 rounded-xl p-2 text-center"><p className="text-[10px] text-muted-foreground">Monthly</p><p className="text-xs font-bold">{formatTZSCompact(monthlyDue)}</p></div>
          <div className={`rounded-xl p-2 text-center ${dti > 30 ? "bg-coral-light" : "bg-success-light"}`}>
            <p className={`text-[10px] ${dti > 30 ? "text-coral" : "text-success"}`}>DTI</p>
            <p className={`text-xs font-bold ${dti > 30 ? "text-coral" : "text-success"}`}>{dti.toFixed(0)}%</p>
          </div>
        </div>
        <button onClick={() => setCreating(!creating)} className="mt-3 w-full text-xs font-semibold py-2 rounded-xl gradient-ocean text-primary-foreground">
          {creating ? "Close" : "+ Add Loan"}
        </button>
        {creating && (
          <form onSubmit={submit} className="space-y-2 mt-3 bg-muted/30 rounded-xl p-3">
            <input required placeholder="Lender" value={form.lender} onChange={e => setForm({ ...form, lender: e.target.value })} className={f} />
            <input placeholder="Purpose" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} className={f} />
            <div className="grid grid-cols-2 gap-2">
              <input required type="number" placeholder="Principal" value={form.principal} onChange={e => setForm({ ...form, principal: e.target.value })} className={f} />
              <input type="number" step="0.1" placeholder="Interest %" value={form.interest_rate} onChange={e => setForm({ ...form, interest_rate: e.target.value })} className={f} />
              <input required type="number" placeholder="Monthly TZS" value={form.monthly_installment} onChange={e => setForm({ ...form, monthly_installment: e.target.value })} className={f} />
              <input required type="number" placeholder="Term months" value={form.term_months} onChange={e => setForm({ ...form, term_months: e.target.value })} className={f} />
            </div>
            <button type="submit" disabled={add.isPending} className="w-full text-xs font-semibold py-2 rounded-xl bg-primary text-primary-foreground">{add.isPending ? "Saving…" : "Save Loan"}</button>
          </form>
        )}
        <div className="space-y-2 mt-4">
          {loans.map((l: any) => {
            const paid = Number(l.principal) - Number(l.remaining_balance);
            const pct = Number(l.principal) > 0 ? (paid / Number(l.principal)) * 100 : 0;
            return (
              <div key={l.id} className="bg-card rounded-xl p-3 shadow-card">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold">{l.lender}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${l.status === "completed" ? "bg-success-light text-success" : "bg-ocean-surface text-primary"}`}>{l.status}</span>
                </div>
                {l.purpose && <p className="text-[11px] text-muted-foreground">{l.purpose}</p>}
                <div className="h-2 bg-muted rounded-full overflow-hidden my-2">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
                  <span>{formatTZSCompact(paid)} paid</span>
                  <span>{formatTZSCompact(Number(l.remaining_balance))} left</span>
                </div>
                {l.status === "active" && (
                  <button onClick={() => pay.mutate({ loan_id: l.id, amount: Number(l.monthly_installment), new_balance: Number(l.remaining_balance) - Number(l.monthly_installment) })}
                    className="w-full text-[11px] font-medium py-1.5 rounded-lg bg-primary/10 text-primary">Record Payment ({formatTZSCompact(Number(l.monthly_installment))})</button>
                )}
              </div>
            );
          })}
          {loans.length === 0 && <Empty text="No loans recorded." />}
        </div>
        <div className="mt-4">
          <AIAdvisorButton mode="debt" label="AI Debt Advice" context={{ totalOwed, monthlyDue, dti, avgRevenue: m.avgRevenue, loans: loans.map((l: any) => ({ lender: l.lender, balance: l.remaining_balance, monthly: l.monthly_installment, rate: l.interest_rate })) }} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
