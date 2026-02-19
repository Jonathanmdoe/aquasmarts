import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { useAddBatch } from "@/hooks/useMutations";

export default function AddBatchForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Tilapia");
  const [pond, setPond] = useState("");
  const [count, setCount] = useState(100);
  const [stockDate, setStockDate] = useState(new Date().toISOString().split("T")[0]);
  const mutation = useAddBatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync({ name, species, pond, initial_count: count, stock_date: stockDate });
    setOpen(false);
    setName(""); setPond(""); setCount(100);
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
          <SheetTitle>Add New Batch</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Batch Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Batch A1"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Species</label>
            <select value={species} onChange={e => setSpecies(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30">
              <option>Tilapia</option>
              <option>Catfish</option>
              <option>Nile Perch</option>
              <option>Trout</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Pond / Tank</label>
            <input value={pond} onChange={e => setPond(e.target.value)} placeholder="e.g. Pond 1"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Initial Count *</label>
              <input type="number" min={1} value={count} onChange={e => setCount(Number(e.target.value))} required
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Stock Date</label>
              <input type="date" value={stockDate} onChange={e => setStockDate(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <button type="submit" disabled={mutation.isPending}
            className="w-full gradient-ocean text-primary-foreground font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {mutation.isPending ? "Adding..." : "Add Batch"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
