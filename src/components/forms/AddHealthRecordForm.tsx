import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { useAddHealthRecord } from "@/hooks/useMutations";
import { useBatches } from "@/hooks/useFarm";

export default function AddHealthRecordForm() {
  const [open, setOpen] = useState(false);
  const { data: batches } = useBatches();
  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [recordType, setRecordType] = useState("observation");
  const [severity, setSeverity] = useState("low");
  const [description, setDescription] = useState("");
  const [treatment, setTreatment] = useState("");
  const [mortalityCount, setMortalityCount] = useState(0);
  const mutation = useAddHealthRecord();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync({ batch_id: batchId, title, record_type: recordType, severity, description, treatment, mortality_count: mortalityCount });
    setOpen(false);
    setTitle(""); setDescription(""); setTreatment(""); setMortalityCount(0);
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
          <SheetTitle>Add Health Record</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Batch *</label>
            <select value={batchId} onChange={e => setBatchId(e.target.value)} required className={fieldClass}>
              <option value="">Select batch</option>
              {batches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Gill discoloration observed" className={fieldClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <select value={recordType} onChange={e => setRecordType(e.target.value)} className={fieldClass}>
                <option value="observation">Observation</option>
                <option value="treatment">Treatment</option>
                <option value="mortality">Mortality</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Severity</label>
              <select value={severity} onChange={e => setSeverity(e.target.value)} className={fieldClass}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={fieldClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Treatment</label>
              <input value={treatment} onChange={e => setTreatment(e.target.value)} placeholder="e.g. Salt bath" className={fieldClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Mortality Count</label>
              <input type="number" min={0} value={mortalityCount} onChange={e => setMortalityCount(Number(e.target.value))} className={fieldClass} />
            </div>
          </div>
          <button type="submit" disabled={mutation.isPending}
            className="w-full gradient-ocean text-primary-foreground font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {mutation.isPending ? "Saving..." : "Add Record"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
