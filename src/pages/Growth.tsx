import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Plus, Ruler, Scale, TrendingUp, Loader2, Trash2, LineChart as LineIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useBatches } from "@/hooks/useFarm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const field =
  "w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30";

interface Sample {
  id: string;
  batch_id: string;
  sample_date: string;
  avg_weight_g: number;
  avg_length_cm: number | null;
  sample_size: number;
  notes: string | null;
}

function AddSampleSheet({
  batchId, open, onOpenChange,
}: { batchId: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [size, setSize] = useState("30");
  const [notes, setNotes] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;
    setSaving(true);
    const { error } = await supabase.from("growth_samples").insert({
      batch_id: batchId,
      sample_date: date,
      avg_weight_g: Number(weight),
      avg_length_cm: length ? Number(length) : null,
      sample_size: size ? Number(size) : 0,
      notes: notes || null,
      created_by: user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not save sample", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Sampling recorded", description: "Batch average weight & biomass updated." });
    setWeight(""); setLength(""); setNotes("");
    qc.invalidateQueries({ queryKey: ["growth_samples"] });
    qc.invalidateQueries({ queryKey: ["batches"] });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[88vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Record Sampling / Grading</SheetTitle></SheetHeader>
        <form onSubmit={submit} className="space-y-4 mt-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Sampling date *</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Avg weight (g) *</label>
              <input type="number" step="0.1" min={0} required value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 120.5" className={field} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Avg length (cm)</label>
              <input type="number" step="0.1" min={0} value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g. 18.2" className={field} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Fish sampled</label>
              <input type="number" min={0} value={size} onChange={(e) => setSize(e.target.value)} className={field} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (grading, uniformity)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={field} placeholder="e.g. Graded into 2 sizes, good uniformity" />
          </div>
          <button type="submit" disabled={saving} className="w-full gradient-ocean text-primary-foreground font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {saving ? "Saving…" : "Save Sampling"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default function Growth() {
  const [params, setParams] = useSearchParams();
  const { data: batches = [], isLoading: batchesLoading } = useBatches();
  const [batchId, setBatchId] = useState<string | null>(params.get("batchId"));
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!batchId && batches.length > 0) setBatchId(batches[0].id);
  }, [batches, batchId]);

  const { data: samples = [], isLoading } = useQuery({
    queryKey: ["growth_samples", batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("growth_samples")
        .select("*")
        .eq("batch_id", batchId!)
        .order("sample_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Sample[];
    },
    enabled: !!batchId,
  });

  const batch = batches.find((b: any) => b.id === batchId);

  const chartData = useMemo(
    () =>
      samples.map((s) => ({
        date: new Date(s.sample_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        weight: Number(s.avg_weight_g),
        length: s.avg_length_cm ? Number(s.avg_length_cm) : null,
      })),
    [samples]
  );

  const stats = useMemo(() => {
    if (samples.length === 0) return null;
    const first = samples[0];
    const last = samples[samples.length - 1];
    const days = Math.max(
      1,
      Math.round((new Date(last.sample_date).getTime() - new Date(first.sample_date).getTime()) / 86400000)
    );
    const gain = Number(last.avg_weight_g) - Number(first.avg_weight_g);
    return {
      latestWeight: Number(last.avg_weight_g),
      latestLength: last.avg_length_cm ? Number(last.avg_length_cm) : null,
      dgr: samples.length > 1 ? gain / days : 0,
      samples: samples.length,
    };
  }, [samples]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("growth_samples").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["growth_samples"] });
  };

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Growth & Sampling</h1>
            <p className="text-xs text-primary-foreground/70">Track weight & length per batch</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            disabled={!batchId}
            className="bg-primary-foreground/15 text-primary-foreground p-2.5 rounded-xl disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <select
          value={batchId ?? ""}
          onChange={(e) => { setBatchId(e.target.value); setParams({ batchId: e.target.value }); }}
          className="w-full bg-primary-foreground/10 text-primary-foreground rounded-xl px-3 py-2.5 text-sm border-0 outline-none"
        >
          {batches.length === 0 && <option value="">No batches yet</option>}
          {batches.map((b: any) => (
            <option key={b.id} value={b.id} className="text-foreground">
              {b.name} · {b.species}
            </option>
          ))}
        </select>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-3 pb-6">
        {batchesLoading || isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card rounded-2xl p-3 shadow-card">
                <Scale className="w-4 h-4 text-primary mb-1" />
                <p className="text-[10px] text-muted-foreground">Avg weight</p>
                <p className="text-base font-bold">{stats ? `${stats.latestWeight} g` : "—"}</p>
              </div>
              <div className="bg-card rounded-2xl p-3 shadow-card">
                <Ruler className="w-4 h-4 text-secondary mb-1" />
                <p className="text-[10px] text-muted-foreground">Avg length</p>
                <p className="text-base font-bold">{stats?.latestLength ? `${stats.latestLength} cm` : "—"}</p>
              </div>
              <div className="bg-card rounded-2xl p-3 shadow-card">
                <TrendingUp className="w-4 h-4 text-success mb-1" />
                <p className="text-[10px] text-muted-foreground">Growth rate</p>
                <p className="text-base font-bold">{stats ? `${stats.dgr.toFixed(2)} g/d` : "—"}</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-4 shadow-card">
              <p className="text-sm font-semibold mb-2">Growth curve · {batch?.name ?? "—"}</p>
              {chartData.length < 1 ? (
                <div className="py-10 text-center">
                  <LineIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Record a sampling to start the curve.</p>
                </div>
              ) : (
                <div className="h-56 -ml-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis yAxisId="w" tick={{ fontSize: 10 }} stroke="hsl(var(--primary))" />
                      <YAxis yAxisId="l" orientation="right" tick={{ fontSize: 10 }} stroke="hsl(var(--secondary))" />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line yAxisId="w" type="monotone" dataKey="weight" name="Weight (g)" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line yAxisId="l" type="monotone" dataKey="length" name="Length (cm)" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-card rounded-2xl p-4 shadow-card">
              <p className="text-sm font-semibold mb-2">Sampling history</p>
              {samples.length === 0 ? (
                <p className="text-xs text-muted-foreground">No samplings recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {[...samples].reverse().map((s, idx, arr) => {
                    const prev = arr[idx + 1];
                    const days = prev
                      ? Math.max(1, Math.round((new Date(s.sample_date).getTime() - new Date(prev.sample_date).getTime()) / 86400000))
                      : 0;
                    const rate = prev ? (Number(s.avg_weight_g) - Number(prev.avg_weight_g)) / days : null;
                    return (
                      <div key={s.id} className="flex items-start justify-between gap-2 border-b border-border last:border-0 pb-2 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold">
                            {new Date(s.sample_date).toLocaleDateString()} · {s.avg_weight_g} g
                            {s.avg_length_cm ? ` · ${s.avg_length_cm} cm` : ""}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {s.sample_size} fish sampled
                            {rate !== null ? ` · ${rate >= 0 ? "+" : ""}${rate.toFixed(2)} g/day` : ""}
                          </p>
                          {s.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{s.notes}</p>}
                        </div>
                        <button onClick={() => remove(s.id)} className="p-1.5 rounded-lg bg-muted text-muted-foreground">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AddSampleSheet batchId={batchId} open={open} onOpenChange={setOpen} />
    </div>
  );
}
