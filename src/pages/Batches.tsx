import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Fish } from "lucide-react";
import BatchCard, { BatchData } from "@/components/BatchCard";
import { useBatches } from "@/hooks/useFarm";
import AddBatchForm from "@/components/forms/AddBatchForm";

const filters = ["All", "Active", "Stocked", "Harvested"];

export default function Batches() {
  const [activeFilter, setActiveFilter] = useState("All");
  const { data: rawBatches, isLoading } = useBatches();

  const batches: BatchData[] = (rawBatches ?? []).map((b) => ({
    id: b.name,
    name: b.name,
    species: b.species,
    stage: b.stage,
    count: b.current_count,
    avgWeight: b.avg_weight ?? 0,
    biomass: b.biomass ?? 0,
    fcr: b.fcr ?? 0,
    mortality: b.mortality_rate ?? 0,
    daysActive: Math.floor((Date.now() - new Date(b.stock_date).getTime()) / 86400000),
    status: b.status as BatchData["status"],
    pond: b.pond ?? "—",
  }));

  const filtered = activeFilter === "All"
    ? batches
    : batches.filter(b => b.status === activeFilter.toLowerCase());

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Batches</h1>
            <p className="text-xs text-primary-foreground/70">{batches.length} total batches</p>
          </div>
          <AddBatchForm />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50" />
          <input placeholder="Search batches..." className="w-full bg-primary-foreground/10 backdrop-blur text-primary-foreground placeholder:text-primary-foreground/40 rounded-xl pl-10 pr-10 py-2.5 text-sm border-0 outline-none focus:bg-primary-foreground/15 transition" />
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50" />
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-3 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`text-xs font-medium px-4 py-1.5 rounded-full whitespace-nowrap transition ${
                activeFilter === f ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground shadow-card"
              }`}>
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-xl p-6 shadow-card text-center">
            <Fish className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No batches yet. Add your first batch!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((batch, i) => (
              <BatchCard key={batch.id} batch={batch} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
