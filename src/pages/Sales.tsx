import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, X, User, Phone, Mail, Truck, Loader2, Receipt, Download, Search,
  Clock, CheckCircle2, PackageCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatTZS } from "@/lib/currency";

const STATUSES = ["pending", "in_transit", "delivered"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning-light text-warning",
  in_transit: "bg-primary/10 text-primary",
  delivered: "bg-success-light text-success",
};

const NEXT_STATUS: Record<Status, Status | null> = {
  pending: "in_transit",
  in_transit: "delivered",
  delivered: null,
};

const NEXT_LABEL: Record<Status, string> = {
  pending: "Mark In Transit",
  in_transit: "Mark Delivered",
  delivered: "Delivered",
};

const saleSchema = z.object({
  buyer_name: z.string().trim().min(2, "Required").max(100),
  buyer_type: z.string().min(1, "Select type"),
  buyer_email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  buyer_phone: z.string().trim().min(5, "Required").max(30),
  quantity: z.string().trim().min(1, "Required").max(50),
  total_amount: z.coerce.number().min(0, "Must be ≥0"),
  delivery_status: z.string().min(1),
  notes: z.string().trim().max(500).optional(),
});

type SaleValues = z.infer<typeof saleSchema>;

function AddSaleForm({ onClose }: { onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const form = useForm<SaleValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      buyer_name: "",
      buyer_type: "individual",
      buyer_email: "",
      buyer_phone: "",
      quantity: "",
      total_amount: 0,
      delivery_status: "pending",
      notes: "",
    },
  });

  const onSubmit = async (values: SaleValues) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Login required");
      const { error } = await supabase.from("sales_records" as any).insert({
        seller_id: user.id,
        buyer_name: values.buyer_name,
        buyer_type: values.buyer_type,
        buyer_email: values.buyer_email || null,
        buyer_phone: values.buyer_phone,
        quantity: values.quantity,
        total_amount: values.total_amount,
        delivery_status: values.delivery_status,
        notes: values.notes || null,
      } as any);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["sales_records"] });
      toast({ title: "Sale recorded!" });
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-end justify-center">
      <div className="bg-card w-full max-w-md rounded-t-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card flex items-center justify-between px-4 pt-4 pb-2 border-b border-border/50">
          <h2 className="text-base font-bold font-display text-foreground">Record a Sale</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-3">
            <FormField control={form.control} name="buyer_name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Buyer Name</FormLabel>
                <FormControl><Input placeholder="Full name or company" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="buyer_type" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Buyer Type</FormLabel>
                <FormControl>
                  <select value={field.value} onChange={field.onChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                    <option value="group">Group / Cooperative</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="buyer_phone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Phone</FormLabel>
                  <FormControl><Input placeholder="+255..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="buyer_email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Email (optional)</FormLabel>
                  <FormControl><Input type="email" placeholder="buyer@..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Quantity</FormLabel>
                  <FormControl><Input placeholder="e.g. 500 fingerlings" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="total_amount" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Total (TZS)</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="0" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="delivery_status" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Delivery Status</FormLabel>
                <FormControl>
                  <select value={field.value} onChange={field.onChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="pending">Pending</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Notes (optional)</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Address, special instructions..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" disabled={submitting} className="w-full mt-2">
              {submitting ? "Saving…" : "Save Sale"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

function csvEscape(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCSV(rows: any[]) {
  const headers = [
    "sale_date", "buyer_name", "buyer_type", "buyer_phone", "buyer_email",
    "quantity", "total_amount_TZS", "delivery_status", "notes", "created_at",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.sale_date, r.buyer_name, r.buyer_type, r.buyer_phone, r.buyer_email,
      r.quantity, r.total_amount, r.delivery_status, r.notes, r.created_at,
    ].map(csvEscape).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sales_records_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const FILTERS: { key: "all" | Status; label: string; icon: any }[] = [
  { key: "all", label: "All", icon: Receipt },
  { key: "pending", label: "Pending", icon: Clock },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export default function Sales() {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales_records"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("sales_records" as any)
        .select("*")
        .order("created_at", { ascending: false }) as any);
      if (error) throw error;
      return data as any[];
    },
  });

  const advance = async (id: string, current: Status) => {
    const next = NEXT_STATUS[current];
    if (!next) return;
    setUpdatingId(id);
    const { error } = await (supabase.from("sales_records" as any)
      .update({ delivery_status: next })
      .eq("id", id) as any);
    setUpdatingId(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["sales_records"] });
    toast({ title: `Marked ${next.replace("_", " ")}` });
  };

  const setStatus = async (id: string, status: Status) => {
    const { error } = await (supabase.from("sales_records" as any)
      .update({ delivery_status: status })
      .eq("id", id) as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["sales_records"] });
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: sales.length, pending: 0, in_transit: 0, delivered: 0 };
    for (const s of sales) c[s.delivery_status] = (c[s.delivery_status] || 0) + 1;
    return c;
  }, [sales]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sales.filter((s: any) => {
      if (filter !== "all" && s.delivery_status !== filter) return false;
      if (!q) return true;
      return (
        s.buyer_name?.toLowerCase().includes(q) ||
        s.buyer_phone?.toLowerCase().includes(q) ||
        s.buyer_email?.toLowerCase().includes(q) ||
        s.quantity?.toLowerCase().includes(q)
      );
    });
  }, [sales, filter, search]);

  const totalRevenue = filtered.reduce((s: number, x: any) => s + Number(x.total_amount || 0), 0);
  const pendingCount = sales.filter((s: any) => s.delivery_status !== "delivered").length;

  return (
    <div className="min-h-screen relative pb-6">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Sales Records</h1>
            <p className="text-xs text-primary-foreground/70">Track buyers & delivery status</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCSV(filtered)}
              disabled={filtered.length === 0}
              className="text-xs font-medium bg-primary-foreground/10 text-primary-foreground rounded-lg px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
            >
              <Download className="w-3 h-3" /> Export
            </button>
            <button onClick={() => setShowForm(true)}
              className="text-xs font-medium bg-accent text-accent-foreground rounded-lg px-3 py-1.5 flex items-center gap-1">
              <Plus className="w-3 h-3" /> New
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-3">
            <p className="text-[10px] text-primary-foreground/70">
              {filter === "all" ? "Total Revenue" : "Filtered Revenue"}
            </p>
            <p className="text-sm font-bold text-primary-foreground">{formatTZS(totalRevenue)}</p>
          </div>
          <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-3">
            <p className="text-[10px] text-primary-foreground/70">Pending Deliveries</p>
            <p className="text-sm font-bold text-primary-foreground">{pendingCount}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search buyer name, phone, email…"
            className="w-full bg-card rounded-xl pl-9 pr-3 py-2.5 text-sm shadow-card border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          {FILTERS.map((f) => {
            const Icon = f.icon;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {f.label}
                <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                  active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                }`}>
                  {counts[f.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl shadow-card">
            <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {sales.length === 0 ? "No sales recorded yet." : "No sales match this filter."}
            </p>
            {sales.length === 0 && (
              <p className="text-xs text-muted-foreground/70 mt-1">Tap "New" to add your first sale.</p>
            )}
          </div>
        ) : (
          filtered.map((s: any) => {
            const status = s.delivery_status as Status;
            const next = NEXT_STATUS[status];
            return (
              <div key={s.id} className="bg-card rounded-2xl p-4 shadow-card space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <h3 className="text-sm font-semibold text-foreground truncate">{s.buyer_name}</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                        {s.buyer_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.buyer_phone}</span>
                      {s.buyer_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.buyer_email}</span>}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground shrink-0">{formatTZS(s.total_amount)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{s.quantity}</p>
                  <span className={`text-[10px] font-medium rounded-full px-2 py-1 capitalize ${STATUS_STYLES[status]}`}>
                    {status.replace("_", " ")}
                  </span>
                </div>

                {s.notes && <p className="text-[11px] text-muted-foreground italic border-t border-border/50 pt-2">{s.notes}</p>}

                {/* Delivery workflow buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  {next ? (
                    <Button
                      size="sm"
                      onClick={() => advance(s.id, status)}
                      disabled={updatingId === s.id}
                      className="flex-1 h-8 text-xs gap-1"
                    >
                      {updatingId === s.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : status === "pending" ? (
                        <Truck className="w-3 h-3" />
                      ) : (
                        <PackageCheck className="w-3 h-3" />
                      )}
                      {NEXT_LABEL[status]}
                    </Button>
                  ) : (
                    <div className="flex-1 flex items-center justify-center gap-1 text-xs text-success font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                    </div>
                  )}
                  {status !== "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStatus(s.id, "pending")}
                      className="h-8 text-xs"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {showForm && <AddSaleForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
