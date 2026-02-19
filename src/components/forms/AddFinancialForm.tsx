import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { useAddFinancialRecord } from "@/hooks/useMutations";
import { useBatches } from "@/hooks/useFarm";

export default function AddFinancialForm() {
  const [open, setOpen] = useState(false);
  const { data: batches } = useBatches();
  const [recordType, setRecordType] = useState("expense");
  const [category, setCategory] = useState("feed");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [batchId, setBatchId] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const mutation = useAddFinancialRecord();

  const categories = recordType === "expense"
    ? ["feed", "medication", "labor", "equipment", "transport", "other"]
    : ["fish_sales", "fingerling_sales", "other"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync({
      record_type: recordType,
      category,
      amount: Number(amount),
      description,
      batch_id: batchId || undefined,
      transaction_date: txDate,
    });
    setOpen(false);
    setAmount(""); setDescription("");
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
          <SheetTitle>Add Transaction</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="flex bg-muted rounded-xl p-1">
            <button type="button" onClick={() => { setRecordType("expense"); setCategory("feed"); }}
              className={`flex-1 text-xs font-medium py-2 rounded-lg transition ${recordType === "expense" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              Expense
            </button>
            <button type="button" onClick={() => { setRecordType("revenue"); setCategory("fish_sales"); }}
              className={`flex-1 text-xs font-medium py-2 rounded-lg transition ${recordType === "revenue" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              Revenue
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={fieldClass}>
              {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount (TZS) *</label>
            <input type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} required placeholder="50000" className={fieldClass} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. 2 bags floating pellets" className={fieldClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Batch (optional)</label>
              <select value={batchId} onChange={e => setBatchId(e.target.value)} className={fieldClass}>
                <option value="">None</option>
                {batches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
              <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className={fieldClass} />
            </div>
          </div>
          <button type="submit" disabled={mutation.isPending}
            className="w-full gradient-ocean text-primary-foreground font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {mutation.isPending ? "Saving..." : "Save Transaction"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
