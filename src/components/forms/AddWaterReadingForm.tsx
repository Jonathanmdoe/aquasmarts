import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { useAddWaterReading } from "@/hooks/useMutations";
import { useBatches } from "@/hooks/useFarm";

export default function AddWaterReadingForm() {
  const [open, setOpen] = useState(false);
  const { data: batches } = useBatches();
  const [batchId, setBatchId] = useState("");
  const [temp, setTemp] = useState<string>("");
  const [ph, setPh] = useState<string>("");
  const [doVal, setDoVal] = useState<string>("");
  const [ammonia, setAmmonia] = useState<string>("");
  const [nitrite, setNitrite] = useState<string>("");
  const mutation = useAddWaterReading();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync({
      batch_id: batchId,
      temperature: temp ? Number(temp) : undefined,
      ph: ph ? Number(ph) : undefined,
      dissolved_oxygen: doVal ? Number(doVal) : undefined,
      ammonia: ammonia ? Number(ammonia) : undefined,
      nitrite: nitrite ? Number(nitrite) : undefined,
    });
    setOpen(false);
    setTemp(""); setPh(""); setDoVal(""); setAmmonia(""); setNitrite("");
  };

  const fieldClass = "w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="w-10 h-10 rounded-xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Log Water Test</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Batch / Pond *</label>
            <select value={batchId} onChange={e => setBatchId(e.target.value)} required className={fieldClass}>
              <option value="">Select batch</option>
              {batches?.map(b => <option key={b.id} value={b.id}>{b.name} – {b.pond ?? "No pond"}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Temp (°C)</label>
              <input type="number" step="0.1" value={temp} onChange={e => setTemp(e.target.value)} placeholder="28.0" className={fieldClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">pH</label>
              <input type="number" step="0.1" value={ph} onChange={e => setPh(e.target.value)} placeholder="7.2" className={fieldClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">DO (mg/L)</label>
              <input type="number" step="0.1" value={doVal} onChange={e => setDoVal(e.target.value)} placeholder="6.0" className={fieldClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">NH₃ (mg/L)</label>
              <input type="number" step="0.01" value={ammonia} onChange={e => setAmmonia(e.target.value)} placeholder="0.02" className={fieldClass} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nitrite (mg/L)</label>
            <input type="number" step="0.01" value={nitrite} onChange={e => setNitrite(e.target.value)} placeholder="0.01" className={fieldClass} />
          </div>
          <button type="submit" disabled={mutation.isPending}
            className="w-full gradient-ocean text-primary-foreground font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {mutation.isPending ? "Saving..." : "Save Reading"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
