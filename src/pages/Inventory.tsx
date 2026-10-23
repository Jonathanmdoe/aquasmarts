import { useState } from "react";
import { Package, Plus, ArrowDownToLine, ArrowUpFromLine, Pencil, Trash2, X } from "lucide-react";
import { useFarm } from "@/hooks/useFarm";
import { useUserRole } from "@/hooks/useUserRole";
import { useDeleteInventoryItem, useInventoryItems, useInventoryMovements, useRecordInventoryMovement, useSaveInventoryItem } from "@/hooks/useOperations";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const input = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30";

export default function Inventory() {
  const { data: farm } = useFarm();
  const { isOwner, isManager } = useUserRole();
  const canManage = isOwner || isManager;
  const { data: items = [], isLoading } = useInventoryItems();
  const { data: movements = [] } = useInventoryMovements();
  const saveItem = useSaveInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const movement = useRecordInventoryMovement();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [moveItem, setMoveItem] = useState<any>(null);
  const [moveType, setMoveType] = useState<"purchase" | "usage">("purchase");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [reference, setReference] = useState("");
  const [form, setForm] = useState({ name: "", category: "equipment", unit: "unit", low_stock_threshold: "", unit_cost: "", supplier: "", notes: "" });

  const openNew = () => { setEdit(null); setForm({ name: "", category: "equipment", unit: "unit", low_stock_threshold: "", unit_cost: "", supplier: "", notes: "" }); setShowForm(true); };
  const openEdit = (item: any) => { setEdit(item); setForm({ name: item.name, category: item.category, unit: item.unit, low_stock_threshold: String(item.low_stock_threshold ?? ""), unit_cost: String(item.unit_cost ?? ""), supplier: item.supplier ?? "", notes: item.notes ?? "" }); setShowForm(true); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await saveItem.mutateAsync({ ...form, id: edit?.id }); setShowForm(false); }
    catch { /* mutation shows an error toast */ }
  };
  const recordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!farm?.id || !user) { toast({ title: "Login required", variant: "destructive" }); return; }
    try {
      await movement.mutateAsync({ farm_id: farm.id, item_id: moveItem.id, movement_type: moveType, quantity: Number(quantity), unit_cost: Number(unitCost || 0), reference, recorded_by: user.id });
      setMoveItem(null); setQuantity(""); setUnitCost(""); setReference("");
    } catch { /* mutation shows an error toast */ }
  };

  return <div className="min-h-screen pb-6">
    <header className="gradient-ocean px-4 pt-10 pb-6 text-primary-foreground">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold font-display">Inventory</h1><p className="text-xs text-primary-foreground/70">Supplies and stock movements for this farm</p></div>
        {canManage && <button onClick={openNew} className="rounded-xl bg-primary-foreground/15 px-3 py-2 text-xs font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Add item</button>}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4"><div className="rounded-xl bg-primary-foreground/10 p-3"><p className="text-lg font-bold">{items.length}</p><p className="text-[11px] text-primary-foreground/70">Tracked items</p></div><div className="rounded-xl bg-primary-foreground/10 p-3"><p className="text-lg font-bold">{items.filter((x: any) => Number(x.quantity) <= Number(x.low_stock_threshold)).length}</p><p className="text-[11px] text-primary-foreground/70">At or below minimum</p></div></div>
    </header>
    <section className="px-4 -mt-3 space-y-3 relative">
      {isLoading ? <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground">Loading inventory…</div> : items.length === 0 ? <div className="rounded-2xl bg-card p-8 text-center shadow-card"><Package className="mx-auto mb-2 h-8 w-8 text-primary"/><p className="text-sm font-semibold">No inventory items yet</p><p className="text-xs text-muted-foreground mt-1">Track medicines, equipment, packaging, and other supplies. Feed is managed in Feeding.</p></div> : items.map((item: any) => {
        const low = Number(item.quantity) <= Number(item.low_stock_threshold);
        const history = movements.filter((m: any) => m.item_id === item.id).slice(0, 3);
        return <article key={item.id} className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="font-semibold text-sm truncate">{item.name}</h2><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize">{item.category}</span></div><p className={`mt-1 text-xs ${low ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{Number(item.quantity).toLocaleString()} {item.unit}{low ? " · restock needed" : ""}</p><p className="text-[10px] text-muted-foreground mt-1">Minimum {Number(item.low_stock_threshold).toLocaleString()} {item.unit}{item.supplier ? ` · ${item.supplier}` : ""}</p></div>
          <div className="flex gap-1 shrink-0">{canManage && <><button onClick={() => openEdit(item)} aria-label="Edit inventory item" className="p-2 rounded-lg bg-muted"><Pencil className="w-3.5 h-3.5"/></button><button onClick={() => deleteItem.mutate(item.id)} aria-label="Delete inventory item" className="p-2 rounded-lg bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5"/></button></>}</div></div>
          <div className={`grid ${canManage ? "grid-cols-2" : "grid-cols-1"} gap-2 mt-3`}>{canManage && <button onClick={() => { setMoveItem(item); setMoveType("purchase"); }} className="rounded-xl border border-border py-2 text-xs font-medium flex justify-center items-center gap-1"><ArrowDownToLine className="w-3.5 h-3.5 text-success"/> Restock</button>}<button onClick={() => { setMoveItem(item); setMoveType("usage"); }} className="rounded-xl border border-border py-2 text-xs font-medium flex justify-center items-center gap-1"><ArrowUpFromLine className="w-3.5 h-3.5 text-primary"/> Record use</button></div>
          {history.length > 0 && <div className="mt-3 border-t border-border/50 pt-2 space-y-1"><p className="text-[10px] font-semibold text-muted-foreground">Recent movements</p>{history.map((m: any) => <p key={m.id} className="flex justify-between gap-2 text-[10px] text-muted-foreground"><span>{m.movement_type}{m.reference ? ` · ${m.reference}` : ""}</span><span>{Number(m.quantity_delta) > 0 ? "+" : ""}{Number(m.quantity_delta)} {item.unit} · {new Date(m.occurred_at).toLocaleDateString()}</span></p>)}</div>}
        </article>;
      })}
    </section>
    {showForm && <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-end justify-center"><form onSubmit={save} className="bg-card w-full max-w-md rounded-t-3xl p-4 pb-8 space-y-3 max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-center"><h2 className="font-bold">{edit ? "Edit item" : "New inventory item"}</h2><button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-lg bg-muted"><X className="w-4 h-4"/></button></div>
      <label className="block text-xs">Name<input required maxLength={100} className={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
      <div className="grid grid-cols-2 gap-3"><label className="block text-xs">Category<select className={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{["equipment","medicine","chemicals","packaging","tools","other"].map(v => <option key={v}>{v}</option>)}</select></label><label className="block text-xs">Unit<input required maxLength={30} placeholder="bottle, kg, pair…" className={input} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}/></label></div>
      <div className="grid grid-cols-2 gap-3"><label className="block text-xs">Low stock minimum<input type="number" min="0" step="any" className={input} value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })}/></label><label className="block text-xs">Unit cost (TZS)<input type="number" min="0" step="any" className={input} value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })}/></label></div>
      <label className="block text-xs">Supplier<input className={input} value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}/></label><label className="block text-xs">Notes<textarea className={input} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}/></label>
      <button disabled={saveItem.isPending} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground">{saveItem.isPending ? "Saving…" : "Save item"}</button>
    </form></div>}
    {moveItem && <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-end justify-center"><form onSubmit={recordMovement} className="bg-card w-full max-w-md rounded-t-3xl p-4 pb-8 space-y-3"><div className="flex justify-between items-center"><h2 className="font-bold">{moveType === "purchase" ? "Restock" : "Record use"}: {moveItem.name}</h2><button type="button" onClick={() => setMoveItem(null)} className="p-2 rounded-lg bg-muted"><X className="w-4 h-4"/></button></div>
      <label className="block text-xs">Quantity ({moveItem.unit})<input required type="number" min="0.001" step="any" max={moveType === "usage" ? moveItem.quantity : undefined} className={input} value={quantity} onChange={e => setQuantity(e.target.value)}/></label>
      {moveType === "purchase" && <label className="block text-xs">Unit cost (TZS)<input type="number" min="0" step="any" className={input} value={unitCost} onChange={e => setUnitCost(e.target.value)}/></label>}
      {moveType === "purchase" && <label className="block text-xs">Supplier / reference<input className={input} value={reference} onChange={e => setReference(e.target.value)}/></label>}
      {moveType === "purchase" && <p className="rounded-lg bg-muted/60 p-2 text-[10px] text-muted-foreground">Purchases with a unit cost are also added to Farm Finance as inventory expenses.</p>}
      <button disabled={movement.isPending} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground">{movement.isPending ? "Saving…" : "Save movement"}</button>
    </form></div>}
  </div>;
}
