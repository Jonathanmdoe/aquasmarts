import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUpdateBatch } from "@/hooks/useMutations";

interface BatchRow {
  id: string;
  name: string;
  pond: string | null;
  avg_weight: number | null;
  current_count: number;
  mortality_rate: number | null;
  status: string;
  stage: string;
}

interface Props {
  batch: BatchRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const field =
  "w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30";

export default function EditBatchSheet({ batch, open, onOpenChange }: Props) {
  const mutation = useUpdateBatch();
  const [avgWeight, setAvgWeight] = useState("");
  const [count, setCount] = useState("");
  const [mortality, setMortality] = useState("");
  const [status, setStatus] = useState("stocked");
  const [stage, setStage] = useState("fingerling");
  const [pond, setPond] = useState("");

  useEffect(() => {
    if (!batch) return;
    setAvgWeight(batch.avg_weight ? String(batch.avg_weight) : "");
    setCount(String(batch.current_count));
    setMortality(batch.mortality_rate ? String(batch.mortality_rate) : "");
    setStatus(batch.status);
    setStage(batch.stage);
    setPond(batch.pond ?? "");
  }, [batch]);

  if (!batch) return null;
  const biomassKg = (Number(avgWeight || 0) * Number(count || 0)) / 1000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync({
      id: batch.id,
      avg_weight: avgWeight ? Number(avgWeight) : 0,
      current_count: count ? Number(count) : 0,
      mortality_rate: mortality ? Number(mortality) : 0,
      status,
      stage,
      pond,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit {batch.name}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Avg Weight (g) *</label>
              <input type="number" step="0.1" min={0} value={avgWeight} onChange={(e) => setAvgWeight(e.target.value)} placeholder="e.g. 25" className={field} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Current Count *</label>
              <input type="number" min={0} value={count} onChange={(e) => setCount(e.target.value)} className={field} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Mortality %</label>
              <input type="number" step="0.1" min={0} max={100} value={mortality} onChange={(e) => setMortality(e.target.value)} className={field} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Pond</label>
              <input value={pond} onChange={(e) => setPond(e.target.value)} className={field} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className={field}>
                <option value="fingerling">Fingerling</option>
                <option value="juvenile">Juvenile</option>
                <option value="grow-out">Grow-out</option>
                <option value="market">Market-size</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
                <option value="stocked">Stocked</option>
                <option value="active">Active</option>
                <option value="harvested">Harvested</option>
              </select>
            </div>
          </div>
          <div className="bg-ocean-surface/50 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Calculated Biomass</p>
            <p className="text-lg font-bold text-primary">{biomassKg.toFixed(2)} kg</p>
          </div>
          <button type="submit" disabled={mutation.isPending} className="w-full gradient-ocean text-primary-foreground font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
