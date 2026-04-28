import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X, User, Phone, Mail, Truck, Loader2, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatTZS } from "@/lib/currency";

const STATUSES = ["pending", "in_transit", "delivered"] as const;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning-light text-warning",
  in_transit: "bg-primary/10 text-primary",
  delivered: "bg-success-light text-success",
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

export default function Sales() {
  const [showForm, setShowForm] = useState(false);
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

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase.from("sales_records" as any)
      .update({ delivery_status: status })
      .eq("id", id) as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["sales_records"] });
    toast({ title: "Delivery updated" });
  };

  const totalRevenue = sales.reduce((s: number, x: any) => s + Number(x.total_amount || 0), 0);
  const pendingCount = sales.filter((s: any) => s.delivery_status !== "delivered").length;

  return (
    <div className="min-h-screen relative">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Sales Records</h1>
            <p className="text-xs text-primary-foreground/70">Track buyers & delivery status</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="text-xs font-medium bg-accent text-accent-foreground rounded-lg px-3 py-1.5 flex items-center gap-1">
            <Plus className="w-3 h-3" /> New
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-3">
            <p className="text-[10px] text-primary-foreground/70">Total Revenue</p>
            <p className="text-sm font-bold text-primary-foreground">{formatTZS(totalRevenue)}</p>
          </div>
          <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-3">
            <p className="text-[10px] text-primary-foreground/70">Pending Deliveries</p>
            <p className="text-sm font-bold text-primary-foreground">{pendingCount}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-3 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl shadow-card">
            <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Tap "New" to add your first sale.</p>
          </div>
        ) : (
          sales.map((s: any) => (
            <div key={s.id} className="bg-card rounded-2xl p-4 shadow-card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">{s.buyer_name}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                      {s.buyer_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.buyer_phone}</span>
                    {s.buyer_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.buyer_email}</span>}
                  </div>
                </div>
                <span className="text-sm font-bold text-foreground">{formatTZS(s.total_amount)}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">{s.quantity}</p>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    value={s.delivery_status}
                    onChange={(e) => updateStatus(s.id, e.target.value)}
                    className={`text-[10px] font-medium rounded-full px-2 py-1 border-0 capitalize ${STATUS_STYLES[s.delivery_status]}`}
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>{st.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
              </div>
              {s.notes && <p className="text-[11px] text-muted-foreground italic">{s.notes}</p>}
            </div>
          ))
        )}
      </div>
      {showForm && <AddSaleForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
