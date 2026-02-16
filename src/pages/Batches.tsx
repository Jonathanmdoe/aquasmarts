import { motion } from "framer-motion";
import { Plus, Search, Filter, Fish } from "lucide-react";
import BatchCard, { BatchData } from "@/components/BatchCard";
import { useState } from "react";

const batches: BatchData[] = [
  {
    id: "B001",
    name: "Batch B001",
    species: "Tilapia",
    stage: "Grow-out",
    count: 12000,
    avgWeight: 450,
    biomass: 5400,
    fcr: 1.38,
    mortality: 2.1,
    daysActive: 87,
    status: "active",
    pond: "Pond 1",
  },
  {
    id: "B002",
    name: "Batch B002",
    species: "Catfish",
    stage: "Fingerling",
    count: 8500,
    avgWeight: 120,
    biomass: 1020,
    fcr: 1.55,
    mortality: 3.4,
    daysActive: 42,
    status: "active",
    pond: "Pond 2",
  },
  {
    id: "B003",
    name: "Batch B003",
    species: "Tilapia",
    stage: "Grow-out",
    count: 6200,
    avgWeight: 720,
    biomass: 4464,
    fcr: 1.42,
    mortality: 1.8,
    daysActive: 124,
    status: "active",
    pond: "Pond 3",
  },
  {
    id: "B004",
    name: "Batch B004",
    species: "Carp",
    stage: "Nursery",
    count: 20000,
    avgWeight: 25,
    biomass: 500,
    fcr: 1.65,
    mortality: 5.2,
    daysActive: 18,
    status: "stocked",
    pond: "Pond 5",
  },
  {
    id: "B005",
    name: "Batch B005",
    species: "Tilapia",
    stage: "Harvested",
    count: 0,
    avgWeight: 800,
    biomass: 0,
    fcr: 1.35,
    mortality: 2.0,
    daysActive: 150,
    status: "harvested",
    pond: "Pond 4",
  },
];

const filters = ["All", "Active", "Stocked", "Harvested"];

export default function Batches() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activeFilter === "All"
    ? batches
    : batches.filter(b => b.status === activeFilter.toLowerCase());

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Batches</h1>
            <p className="text-xs text-primary-foreground/70">{batches.length} total batches</p>
          </div>
          <button className="w-10 h-10 rounded-xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50" />
          <input
            placeholder="Search batches..."
            className="w-full bg-primary-foreground/10 backdrop-blur text-primary-foreground placeholder:text-primary-foreground/40 rounded-xl pl-10 pr-10 py-2.5 text-sm border-0 outline-none focus:bg-primary-foreground/15 transition"
          />
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50" />
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-3 pb-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`text-xs font-medium px-4 py-1.5 rounded-full whitespace-nowrap transition ${
                activeFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground shadow-card"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Batch List */}
        <div className="space-y-3">
          {filtered.map((batch, i) => (
            <BatchCard key={batch.id} batch={batch} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
