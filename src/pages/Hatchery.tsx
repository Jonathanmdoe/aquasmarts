import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Egg, Fish, Plus, Waves, Percent, CalendarClock, Trash2, Pencil, AlertTriangle,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  useBrooders, useHatcheryBatches, useHatcheryPonds,
  useSaveBrooder, useSaveHatcheryBatch, useSaveHatcheryPond, useDeleteHatcheryRow,
  type Brooder, type HatcheryBatch, type HatcheryPond,
} from "@/hooks/useHatchery";
import { useUserRole } from "@/hooks/useUserRole";
import { useI18n } from "@/i18n";

const field =
  "w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30";
const label = "text-xs font-medium text-muted-foreground mb-1 block";

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }) : "—";

const STATUS_TINT: Record<string, string> = {
  stocked: "bg-amber-500/10 text-amber-600",
  restocked: "bg-emerald-500/10 text-emerald-600",
  sold: "bg-slate-500/10 text-slate-600",
  active: "bg-emerald-500/10 text-emerald-600",
  resting: "bg-amber-500/10 text-amber-600",
  retired: "bg-slate-500/10 text-slate-600",
  maintenance: "bg-orange-500/10 text-orange-600",
  inactive: "bg-slate-500/10 text-slate-600",
};

function Stat({ icon, value, caption }: { icon: React.ReactNode; value: string; caption: string }) {
  return (
    <div className="bg-card rounded-2xl shadow-card p-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
        {icon}
      </div>
      <p className="text-base font-bold text-foreground leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{caption}</p>
    </div>
  );
}

/* ───────────────── Production (fry collection & grading) ───────────────── */

function ProductionSheet({
  open, onOpenChange, editing, ponds, brooders,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: HatcheryBatch | null;
  ponds: HatcheryPond[];
  brooders: Brooder[];
}) {
  const save = useSaveHatcheryBatch();
  const [form, setForm] = useState(() => ({
    batch_code: "",
    brooder_id: "",
    collected_date: today(),
    total_collection: "",
    pond_stocked: "",
    total_graded: "",
    sold_amount: "",
    staff: "",
    notes: "",
  }));

  // reload values when the sheet opens for a different record
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const key = editing?.id ?? "new";
  if (open && loadedFor !== key) {
    setLoadedFor(key);
    setForm({
      batch_code: editing?.batch_code ?? "",
      brooder_id: editing?.brooder_id ?? "",
      collected_date: editing?.collected_date ?? today(),
      total_collection: editing ? String(editing.total_collection) : "",
      pond_stocked: editing?.pond_stocked ?? "",
      total_graded: editing ? String(editing.total_graded) : "",
      sold_amount: editing ? String(editing.sold_amount) : "",
      staff: editing?.staff ?? "",
      notes: editing?.notes ?? "",
    });
  }

  const collection = Number(form.total_collection || 0);
  const graded = Number(form.total_graded || 0);
  const sold = Number(form.sold_amount || 0);
  const survival = collection > 0 ? ((graded / collection) * 100).toFixed(1) : "0.0";
  const restocked = Math.max(0, graded - sold);
  const gradingDate = form.collected_date ? addDays(form.collected_date, 25) : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save.mutateAsync({
      id: editing?.id,
      batch_code: form.batch_code.trim().toUpperCase(),
      brooder_id: form.brooder_id || null,
      collected_date: form.collected_date,
      total_collection: collection,
      pond_stocked: form.pond_stocked.trim().toUpperCase(),
      total_graded: graded,
      sold_amount: sold,
      staff: form.staff || null,
      notes: form.notes || null,
    } as any);
    if (!save.isError) onOpenChange(false);
  };

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit fry batch" : "New fry collection"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Batch code *</label>
              <input required value={form.batch_code} onChange={(e) => set("batch_code", e.target.value)}
                placeholder="FRY-001" className={field} />
            </div>
            <div>
              <label className={label}>Collected date *</label>
              <input type="date" required value={form.collected_date}
                onChange={(e) => set("collected_date", e.target.value)} className={field} />
            </div>
          </div>

          <div>
            <label className={label}>Brooder group (source)</label>
            <select value={form.brooder_id} onChange={(e) => set("brooder_id", e.target.value)} className={field}>
              <option value="">Not specified</option>
              {brooders.map((b) => (
                <option key={b.id} value={b.id}>{b.brooder_code} · {b.pond_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Fry collected *</label>
              <input type="number" min={0} required value={form.total_collection}
                onChange={(e) => set("total_collection", e.target.value)} placeholder="12000" className={field} />
            </div>
            <div>
              <label className={label}>Nursery pond *</label>
              <input required list="hatchery-pond-list" value={form.pond_stocked}
                onChange={(e) => set("pond_stocked", e.target.value)} placeholder="A1" className={field} />
              <datalist id="hatchery-pond-list">
                {ponds.map((p) => <option key={p.id} value={p.name} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Graded (survived)</label>
              <input type="number" min={0} value={form.total_graded}
                onChange={(e) => set("total_graded", e.target.value)} placeholder="0" className={field} />
            </div>
            <div>
              <label className={label}>Sold from grading</label>
              <input type="number" min={0} value={form.sold_amount}
                onChange={(e) => set("sold_amount", e.target.value)} placeholder="0" className={field} />
            </div>
          </div>

          <div className="bg-muted/40 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">Grading due</p>
              <p className="text-xs font-semibold">{fmtDate(gradingDate)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Survival</p>
              <p className="text-xs font-semibold">{survival}%</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Restocked</p>
              <p className="text-xs font-semibold">{restocked.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Staff</label>
              <input value={form.staff} onChange={(e) => set("staff", e.target.value)} className={field} />
            </div>
            <div>
              <label className={label}>Notes</label>
              <input value={form.notes} onChange={(e) => set("notes", e.target.value)} className={field} />
            </div>
          </div>

          <button type="submit" disabled={save.isPending}
            className="w-full gradient-ocean text-primary-foreground font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {save.isPending ? "Saving…" : "Save batch"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ───────────────── Brooders ───────────────── */

function BrooderSheet({
  open, onOpenChange, editing, ponds,
}: { open: boolean; onOpenChange: (v: boolean) => void; editing: Brooder | null; ponds: HatcheryPond[] }) {
  const save = useSaveBrooder();
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [form, setForm] = useState({
    brooder_code: "", species: "Nile Tilapia", quantity: "", male_count: "", female_count: "",
    stocking_date: today(), pond_name: "", avg_weight_g: "", health_status: "active", staff: "",
  });
  const key = editing?.id ?? "new";
  if (open && loadedFor !== key) {
    setLoadedFor(key);
    setForm({
      brooder_code: editing?.brooder_code ?? "",
      species: editing?.species ?? "Nile Tilapia",
      quantity: editing ? String(editing.quantity) : "",
      male_count: editing?.male_count != null ? String(editing.male_count) : "",
      female_count: editing?.female_count != null ? String(editing.female_count) : "",
      stocking_date: editing?.stocking_date ?? today(),
      pond_name: editing?.pond_name ?? "",
      avg_weight_g: editing ? String(editing.avg_weight_g) : "",
      health_status: editing?.health_status ?? "active",
      staff: editing?.staff ?? "",
    });
  }
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save.mutateAsync({
      id: editing?.id,
      brooder_code: form.brooder_code.trim().toUpperCase(),
      species: form.species,
      quantity: Number(form.quantity || 0),
      male_count: form.male_count ? Number(form.male_count) : null,
      female_count: form.female_count ? Number(form.female_count) : null,
      stocking_date: form.stocking_date,
      pond_name: form.pond_name.trim().toUpperCase(),
      avg_weight_g: Number(form.avg_weight_g || 0),
      health_status: form.health_status,
      staff: form.staff || null,
    } as any);
    if (!save.isError) onOpenChange(false);
  };

  const ratio =
    form.male_count && form.female_count
      ? `1 : ${(Number(form.female_count) / Math.max(1, Number(form.male_count))).toFixed(1)}`
      : "—";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit brooder group" : "Stock brooders"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Brooder ID *</label>
              <input required value={form.brooder_code} onChange={(e) => set("brooder_code", e.target.value)}
                placeholder="BR-001" className={field} />
            </div>
            <div>
              <label className={label}>Species *</label>
              <select value={form.species} onChange={(e) => set("species", e.target.value)} className={field}>
                <option>Nile Tilapia</option>
                <option>Red Tilapia</option>
                <option>Blue Tilapia</option>
                <option>Catfish</option>
              </select>
            </div>
            <div>
              <label className={label}>Total fish *</label>
              <input type="number" min={0} required value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)} placeholder="200" className={field} />
            </div>
            <div>
              <label className={label}>Pond *</label>
              <input required list="hatchery-pond-list-b" value={form.pond_name}
                onChange={(e) => set("pond_name", e.target.value)} placeholder="B2" className={field} />
              <datalist id="hatchery-pond-list-b">
                {ponds.map((p) => <option key={p.id} value={p.name} />)}
              </datalist>
            </div>
            <div>
              <label className={label}>Males</label>
              <input type="number" min={0} value={form.male_count}
                onChange={(e) => set("male_count", e.target.value)} placeholder="60" className={field} />
            </div>
            <div>
              <label className={label}>Females</label>
              <input type="number" min={0} value={form.female_count}
                onChange={(e) => set("female_count", e.target.value)} placeholder="180" className={field} />
            </div>
            <div>
              <label className={label}>Avg weight (g)</label>
              <input type="number" step="0.1" min={0} value={form.avg_weight_g}
                onChange={(e) => set("avg_weight_g", e.target.value)} placeholder="250" className={field} />
            </div>
            <div>
              <label className={label}>Stocked on *</label>
              <input type="date" required value={form.stocking_date}
                onChange={(e) => set("stocking_date", e.target.value)} className={field} />
            </div>
            <div>
              <label className={label}>Condition</label>
              <select value={form.health_status} onChange={(e) => set("health_status", e.target.value)} className={field}>
                <option value="active">Active (spawning)</option>
                <option value="resting">Resting</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className={label}>Staff</label>
              <input value={form.staff} onChange={(e) => set("staff", e.target.value)} className={field} />
            </div>
          </div>

          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Male : female ratio</p>
            <p className="text-xs font-semibold">{ratio}</p>
          </div>

          <button type="submit" disabled={save.isPending}
            className="w-full gradient-ocean text-primary-foreground font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {save.isPending ? "Saving…" : "Save brooders"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ───────────────── Ponds ───────────────── */

function PondSheet({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (v: boolean) => void; editing: HatcheryPond | null }) {
  const save = useSaveHatcheryPond();
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", capacity: "", purpose: "nursery", status: "active" });
  const key = editing?.id ?? "new";
  if (open && loadedFor !== key) {
    setLoadedFor(key);
    setForm({
      name: editing?.name ?? "",
      capacity: editing?.capacity != null ? String(editing.capacity) : "",
      purpose: editing?.purpose ?? "nursery",
      status: editing?.status ?? "active",
    });
  }
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save.mutateAsync({
      id: editing?.id,
      name: form.name.trim().toUpperCase(),
      capacity: form.capacity ? Number(form.capacity) : null,
      purpose: form.purpose,
      status: form.status,
    } as any);
    if (!save.isError) onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader><SheetTitle>{editing ? "Edit pond" : "Add hatchery pond"}</SheetTitle></SheetHeader>
        <form onSubmit={submit} className="space-y-4 mt-4">
          <div>
            <label className={label}>Pond name *</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="A1" className={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Capacity (fish)</label>
              <input type="number" min={0} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="20000" className={field} />
            </div>
            <div>
              <label className={label}>Purpose</label>
              <select value={form.purpose} onChange={(e) => set("purpose", e.target.value)} className={field}>
                <option value="brooder">Brooder</option>
                <option value="incubation">Incubation / hapa</option>
                <option value="nursery">Nursery (fry)</option>
                <option value="grow_out">Grow-out</option>
              </select>
            </div>
          </div>
          <div>
            <label className={label}>Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={field}>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" disabled={save.isPending}
            className="w-full gradient-ocean text-primary-foreground font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {save.isPending ? "Saving…" : "Save pond"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ───────────────── Page ───────────────── */

type Tab = "production" | "brooders" | "ponds";

export default function Hatchery() {
  const { t } = useI18n();
  const { isOwner, isSuperAdmin } = useUserRole();
  const canDelete = isOwner || isSuperAdmin;

  const { data: batches = [], isLoading } = useHatcheryBatches();
  const { data: brooders = [] } = useBrooders();
  const { data: ponds = [] } = useHatcheryPonds();

  const [tab, setTab] = useState<Tab>("production");
  const [batchSheet, setBatchSheet] = useState(false);
  const [editBatch, setEditBatch] = useState<HatcheryBatch | null>(null);
  const [brooderSheet, setBrooderSheet] = useState(false);
  const [editBrooder, setEditBrooder] = useState<Brooder | null>(null);
  const [pondSheet, setPondSheet] = useState(false);
  const [editPond, setEditPond] = useState<HatcheryPond | null>(null);

  const delBatch = useDeleteHatcheryRow("hatchery_production", "hatchery_production");
  const delBrooder = useDeleteHatcheryRow("brooders", "brooders");
  const delPond = useDeleteHatcheryRow("hatchery_ponds", "hatchery_ponds");

  const stats = useMemo(() => {
    const live = batches.filter((b) => b.status !== "sold");
    const fryInPonds = live.reduce((s, b) => s + (b.total_graded > 0 ? b.restocked_amount : b.total_collection), 0);
    const brooderFish = brooders
      .filter((b) => b.health_status !== "retired")
      .reduce((s, b) => s + b.quantity, 0);
    const graded = batches.filter((b) => b.total_graded > 0);
    const avgSurvival = graded.length
      ? (graded.reduce((s, b) => s + Number(b.survival_rate), 0) / graded.length).toFixed(1)
      : "0.0";
    const dueGrading = batches.filter(
      (b) => b.total_graded === 0 && b.grading_date && b.grading_date <= today()
    );
    return { fryInPonds, brooderFish, avgSurvival, liveCount: live.length, dueGrading };
  }, [batches, brooders]);

  const openNew = () => {
    if (tab === "production") { setEditBatch(null); setBatchSheet(true); }
    else if (tab === "brooders") { setEditBrooder(null); setBrooderSheet(true); }
    else { setEditPond(null); setPondSheet(true); }
  };

  return (
    <div className="min-h-screen pb-6">
      <div className="gradient-ocean px-4 pt-10 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">{t("hatchery.title")}</h1>
            <p className="text-xs text-primary-foreground/70 mt-1">{t("hatchery.subtitle")}</p>
          </div>
          <button onClick={openNew} aria-label="Add hatchery record"
            className="w-10 h-10 rounded-xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center active:scale-95 transition">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-5 relative z-10 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={<Fish className="w-4 h-4" />} value={stats.fryInPonds.toLocaleString()} caption="Fry in nursery ponds" />
          <Stat icon={<Egg className="w-4 h-4" />} value={stats.brooderFish.toLocaleString()} caption="Brooder stock" />
          <Stat icon={<Percent className="w-4 h-4" />} value={`${stats.avgSurvival}%`} caption="Avg survival to grading" />
          <Stat icon={<Waves className="w-4 h-4" />} value={String(stats.liveCount)} caption="Live fry batches" />
        </div>

        {stats.dueGrading.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-700">
                {stats.dueGrading.length} batch{stats.dueGrading.length > 1 ? "es" : ""} ready for grading
              </p>
              <p className="text-[11px] text-amber-700/80 mt-0.5">
                {stats.dueGrading.map((b) => `${b.batch_code} (${b.pond_stocked})`).join(", ")} — record the graded count to update survival rate.
              </p>
            </div>
          </motion.div>
        )}

        <div className="flex gap-2 bg-muted/50 p-1 rounded-xl">
          {([["production", "Production"], ["brooders", "Brooders"], ["ponds", "Ponds"]] as [Tab, string][]).map(([id, name]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 text-xs font-semibold py-2 rounded-lg transition ${
                tab === id ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
              }`}>
              {name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "production" ? (
          batches.length === 0 ? (
            <EmptyState text="No fry collections yet. Tap + to record your first spawning collection." />
          ) : (
            <div className="space-y-3">
              {batches.map((b) => (
                <div key={b.id} className="bg-card rounded-2xl shadow-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.batch_code}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Pond {b.pond_stocked} · collected {fmtDate(b.collected_date)}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg capitalize ${STATUS_TINT[b.status]}`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                    <Cell label="Collected" value={b.total_collection.toLocaleString()} />
                    <Cell label="Graded" value={b.total_graded.toLocaleString()} />
                    <Cell label="Survival" value={`${Number(b.survival_rate)}%`} />
                    <Cell label="In pond" value={b.restocked_amount.toLocaleString()} />
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" /> Grading {fmtDate(b.grading_date)}
                      {b.sold_amount > 0 && ` · ${b.sold_amount.toLocaleString()} sold`}
                    </p>
                    <RowActions
                      onEdit={() => { setEditBatch(b); setBatchSheet(true); }}
                      onDelete={canDelete ? () => delBatch.mutate(b.id) : undefined}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === "brooders" ? (
          brooders.length === 0 ? (
            <EmptyState text="No brooder groups yet. Tap + to stock your breeding fish." />
          ) : (
            <div className="space-y-3">
              {brooders.map((b) => (
                <div key={b.id} className="bg-card rounded-2xl shadow-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.brooder_code}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {b.species} · pond {b.pond_name} · since {fmtDate(b.stocking_date)}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg capitalize ${STATUS_TINT[b.health_status]}`}>
                      {b.health_status}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                    <Cell label="Fish" value={b.quantity.toLocaleString()} />
                    <Cell label="Males" value={b.male_count?.toLocaleString() ?? "—"} />
                    <Cell label="Females" value={b.female_count?.toLocaleString() ?? "—"} />
                    <Cell label="Avg wt" value={`${Number(b.avg_weight_g)}g`} />
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <p className="text-[11px] text-muted-foreground">{b.staff ? `Handled by ${b.staff}` : "\u00A0"}</p>
                    <RowActions
                      onEdit={() => { setEditBrooder(b); setBrooderSheet(true); }}
                      onDelete={canDelete ? () => delBrooder.mutate(b.id) : undefined}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : ponds.length === 0 ? (
          <EmptyState text="No hatchery ponds yet. Tap + to map your ponds (A1, A2, B1 …)." />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {ponds.map((p) => {
              const fry = batches.find((b) => b.status !== "sold" && b.pond_stocked === p.name.toUpperCase());
              const brood = brooders.find((b) => b.health_status === "active" && b.pond_name === p.name.toUpperCase());
              return (
                <div key={p.id} className="bg-card rounded-2xl shadow-card p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg capitalize ${STATUS_TINT[p.status]}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 capitalize">
                    {p.purpose.replace("_", "-")}{p.capacity ? ` · cap ${p.capacity.toLocaleString()}` : ""}
                  </p>
                  <p className="text-[11px] mt-2 font-medium">
                    {fry ? `Fry batch ${fry.batch_code}` : brood ? `Brooders ${brood.brooder_code}` : "Empty"}
                  </p>
                  <div className="flex justify-end mt-2">
                    <RowActions
                      onEdit={() => { setEditPond(p); setPondSheet(true); }}
                      onDelete={canDelete ? () => delPond.mutate(p.id) : undefined}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProductionSheet open={batchSheet} onOpenChange={setBatchSheet} editing={editBatch} ponds={ponds} brooders={brooders} />
      <BrooderSheet open={brooderSheet} onOpenChange={setBrooderSheet} editing={editBrooder} ponds={ponds} />
      <PondSheet open={pondSheet} onOpenChange={setPondSheet} editing={editPond} />
    </div>
  );
}

function Cell({ label: l, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-lg py-1.5">
      <p className="text-[10px] text-muted-foreground">{l}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onEdit} aria-label="Edit" className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      {onDelete && (
        <button onClick={onDelete} aria-label="Delete" className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </button>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-card rounded-2xl shadow-card p-6 text-center">
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
