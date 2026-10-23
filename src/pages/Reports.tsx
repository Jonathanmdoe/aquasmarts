import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Printer, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { formatTZS } from "@/lib/currency";

type ReportRows = Record<string, any[]>;

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[=+@\-\t\r]/.test(text)) text = `\t${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(name: string, rows: any[]) {
  if (!rows.length) return;
  const keys = [...new Set(rows.flatMap(row => Object.keys(row)))];
  const csv = [keys.map(csvCell).join(","), ...rows.map(row => keys.map(key => csvCell(row[key])).join(","))].join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `aquasmart_${name}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export default function Reports() {
  const { data: farm } = useFarm();
  const report = useQuery({
    queryKey: ["farm_reports", farm?.id], enabled: !!farm?.id,
    queryFn: async () => {
      const [batches, hatchery, finances, sales, inventory, activities, customers, feedStock, inventoryMovements, feedPurchases] = await Promise.all([
        supabase.from("fish_batches").select("*").eq("farm_id", farm!.id).order("created_at", { ascending: false }),
        (supabase.from("hatchery_production" as any).select("*").eq("farm_id", farm!.id).order("collected_date", { ascending: false }) as any),
        supabase.from("financial_records").select("*").eq("farm_id", farm!.id).order("transaction_date", { ascending: false }),
        (supabase.from("sales_records" as any).select("*").eq("farm_id", farm!.id).order("sale_date", { ascending: false }) as any),
        (supabase.from("inventory_items" as any).select("*").eq("farm_id", farm!.id).order("name") as any),
        (supabase.from("farm_activities" as any).select("*").eq("farm_id", farm!.id).order("activity_date", { ascending: false }) as any),
        (supabase.from("farm_customers" as any).select("*").eq("farm_id", farm!.id).order("name") as any),
        (supabase.from("feed_stock" as any).select("*").eq("farm_id", farm!.id).order("feed_type") as any),
        (supabase.from("inventory_movements" as any).select("*").eq("farm_id", farm!.id).order("occurred_at", { ascending: false }) as any),
        (supabase.from("feed_stock_movements" as any).select("*").eq("farm_id", farm!.id).order("occurred_at", { ascending: false }) as any),
      ]);
      for (const result of [batches, hatchery, finances, sales, inventory, activities, customers, feedStock, inventoryMovements, feedPurchases] as any[]) if (result.error) throw result.error;
      const batchIds = (batches.data ?? []).map((b: any) => b.id);
      const childRows = batchIds.length ? await Promise.all([
        supabase.from("feeding_logs").select("*").in("batch_id", batchIds).order("feeding_time", { ascending: false }),
        supabase.from("water_readings").select("*").in("batch_id", batchIds).order("reading_time", { ascending: false }),
        supabase.from("health_records").select("*").in("batch_id", batchIds).order("recorded_at", { ascending: false }),
        supabase.from("growth_samples" as any).select("*").in("batch_id", batchIds).order("sample_date", { ascending: false }) as any,
      ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }] as any[];
      for (const result of childRows as any[]) if (result.error) throw result.error;
      const [feeding, water, health, growth] = childRows as any[];
      return { batches: batches.data ?? [], hatchery: hatchery.data ?? [], finances: finances.data ?? [], sales: sales.data ?? [], inventory: inventory.data ?? [], inventoryMovements: inventoryMovements.data ?? [], activities: activities.data ?? [], customers: customers.data ?? [], feedStock: feedStock.data ?? [], feedPurchases: feedPurchases.data ?? [], feeding: feeding.data ?? [], water: water.data ?? [], health: health.data ?? [], growth: growth.data ?? [] } as ReportRows;
    },
  });
  const rows = report.data;
  const totalRevenue = (rows?.finances ?? []).filter(x => x.record_type === "revenue").reduce((s, x) => s + Number(x.amount || 0), 0);
  const totalExpenses = (rows?.finances ?? []).filter(x => x.record_type === "expense").reduce((s, x) => s + Number(x.amount || 0), 0);
  const fryAvailable = (rows?.hatchery ?? []).reduce((s, x) => s + Math.max(0, Number(x.restocked_amount || 0) - Number(x.transferred_amount || 0)), 0);
  const exports: { key: keyof ReportRows; label: string; hint: string }[] = [
    { key: "batches", label: "Fish batches", hint: "Stock, species, growth and current counts" },
    { key: "hatchery", label: "Hatchery production", hint: "Collections, grading, sales and fry transfers" },
    { key: "finances", label: "Income and expenses", hint: "Farm financial records" },
    { key: "sales", label: "Sales records", hint: "Customers, quantities, amounts and delivery" },
    { key: "inventory", label: "Inventory", hint: "Current supplies and reorder levels" },
    { key: "inventoryMovements", label: "Inventory movements", hint: "Purchases, usage and adjustments" },
    { key: "activities", label: "Farm activities", hint: "Work log and operational notes" },
    { key: "customers", label: "Customers", hint: "Saved farm buyers and contact details" },
    { key: "feedStock", label: "Feed stock", hint: "Feed type, quantity and reorder levels" },
    { key: "feedPurchases", label: "Feed purchases", hint: "Supplier, quantity and unit cost" },
    { key: "feeding", label: "Feeding logs", hint: "Feed amount and time by batch" },
    { key: "water", label: "Water readings", hint: "Water quality readings by batch" },
    { key: "health", label: "Health records", hint: "Observations, treatment and mortality" },
    { key: "growth", label: "Growth samples", hint: "Sampling measurements by batch" },
  ];

  return <div className="min-h-screen pb-6 print:bg-white print:text-black"><header className="gradient-ocean px-4 pt-10 pb-6 text-primary-foreground print:hidden"><div className="flex justify-between items-start gap-3"><div><h1 className="text-xl font-bold font-display">Reports & Exports</h1><p className="text-xs text-primary-foreground/70">Farm data summaries and downloadable records</p></div><button onClick={() => report.refetch()} className="rounded-xl bg-primary-foreground/15 p-2" aria-label="Refresh reports"><RefreshCw className="w-4 h-4"/></button></div><div className="mt-4 flex gap-2"><button disabled={!rows} onClick={() => window.print()} className="rounded-xl bg-primary-foreground/15 px-3 py-2 text-xs font-semibold flex items-center gap-1"><Printer className="w-4 h-4"/> Print / Save PDF</button></div></header>
    <main className="px-4 -mt-3 relative space-y-4 print:mt-0 print:px-0"><div className="hidden print:block mb-5"><h1 className="text-2xl font-bold">AquaSmart Farm Report</h1><p>{farm?.name} · Generated {new Date().toLocaleString()}</p></div>
      {report.isLoading ? <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground">Preparing farm reports…</div> : report.isError ? <div className="rounded-2xl bg-card p-5 text-sm text-destructive">Could not load reports: {(report.error as Error).message}</div> : rows && <>
        <section className="grid grid-cols-2 gap-2 print:grid-cols-4"><Metric label="Fish batches" value={String(rows.batches.length)}/><Metric label="Fry available" value={fryAvailable.toLocaleString()}/><Metric label="Income recorded" value={formatTZS(totalRevenue)}/><Metric label="Expenses recorded" value={formatTZS(totalExpenses)}/></section>
        <section className="rounded-2xl bg-card p-4 shadow-card"><div className="flex items-center gap-2 mb-3"><FileSpreadsheet className="w-4 h-4 text-primary"/><h2 className="text-sm font-semibold">Export farm data</h2></div><div className="divide-y divide-border/60">{exports.map(x => <div key={x.key} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold">{x.label} <span className="text-muted-foreground font-normal">({rows[x.key].length})</span></p><p className="text-[10px] text-muted-foreground">{x.hint}</p></div><button disabled={!rows[x.key].length} onClick={() => downloadCsv(String(x.key), rows[x.key])} className="shrink-0 rounded-lg bg-primary/10 text-primary p-2 disabled:opacity-40 print:hidden" aria-label={`Download ${x.label} CSV`}><Download className="w-4 h-4"/></button></div>)}</div></section>
        <section className="rounded-2xl bg-card p-4 shadow-card print:break-inside-avoid"><h2 className="text-sm font-semibold mb-3">Operational summary</h2><div className="space-y-2 text-xs"><Summary label="Active fish batches" value={String(rows.batches.filter(x => x.status !== "harvested").length)}/><Summary label="Hatchery production batches" value={String(rows.hatchery.length)}/><Summary label="Recorded sales" value={String(rows.sales.length)}/><Summary label="Inventory items at/below minimum" value={String(rows.inventory.filter(x => Number(x.quantity) <= Number(x.low_stock_threshold)).length)}/><Summary label="Activities recorded" value={String(rows.activities.length)}/><Summary label="Net income recorded" value={formatTZS(totalRevenue - totalExpenses)}/></div></section>
      </>}
    </main>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-card p-3 shadow-card print:border print:border-gray-300"><p className="text-base font-bold">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div>; }
