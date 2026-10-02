import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { useAddFeedingLog } from "@/hooks/useMutations";
import { useBatches } from "@/hooks/useFarm";

export default function AddFeedingForm({ preselectedBatchId }: { preselectedBatchId?: string | null }) {
  const [open, setOpen] = useState(false);
  const { data: batches } = useBatches();
  const [batchId, setBatchId] = useState(preselectedBatchId ?? "");
  const [feedType, setFeedType] = useState("Powder (fry)");
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState<"g" | "kg">("g");
  const [notes, setNotes] = useState("");
  const mutation = useAddFeedingLog();

  useEffect(() => { if (preselectedBatchId) setBatchId(preselectedBatchId); }, [preselectedBatchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync({ batch_id: batchId, feed_type: feedType, amount_kg: unit === "g" ? amount / 1000 : amount, notes });
    setOpen(false);
    setNotes(""); setAmount(1);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="w-10 h-10 rounded-xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Log Feeding</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Batch *</label>
            <select value={batchId} onChange={e => setBatchId(e.target.value)} required
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Select batch</option>
              {batches?.map(b => <option key={b.id} value={b.id}>{b.name} – {b.pond ?? "No pond"}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Feed Type</label>
            <select value={feedType} onChange={e => setFeedType(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30">
              <option>Powder (fry)</option>
              <option>Pellet (brooder)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount *</label>
            <div className="flex gap-2">
            <input type="number" step="0.001" min={0.001} value={amount} onChange={e => setAmount(Number(e.target.value))} required
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            <select value={unit} onChange={e => setUnit(e.target.value as "g" | "kg")}
              className="bg-muted/50 border border-border rounded-xl px-3 text-sm">
              <option value="g">grams</option><option value="kg">kg</option>
            </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any observations..."
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button type="submit" disabled={mutation.isPending}
            className="w-full gradient-ocean text-primary-foreground font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {mutation.isPending ? "Logging..." : "Log Feeding"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
