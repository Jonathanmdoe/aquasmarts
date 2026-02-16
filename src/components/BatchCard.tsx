import { motion } from "framer-motion";
import { Fish, Activity, TrendingUp, MoreVertical } from "lucide-react";

export interface BatchData {
  id: string;
  name: string;
  species: string;
  stage: string;
  count: number;
  avgWeight: number;
  biomass: number;
  fcr: number;
  mortality: number;
  daysActive: number;
  status: "active" | "harvested" | "stocked";
  pond: string;
}

const statusStyle = {
  active: "bg-success-light text-success",
  harvested: "bg-ocean-surface text-primary",
  stocked: "bg-amber-light text-amber",
};

export default function BatchCard({ batch, index = 0 }: { batch: BatchData; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-2xl p-4 shadow-card"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ocean-surface flex items-center justify-center">
            <Fish className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">{batch.name}</h3>
            <p className="text-xs text-muted-foreground">{batch.species} · {batch.pond}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle[batch.status]}`}>
            {batch.status}
          </span>
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground">Count</p>
          <p className="text-sm font-bold text-foreground">{batch.count.toLocaleString()}</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground">Avg Wt</p>
          <p className="text-sm font-bold text-foreground">{batch.avgWeight}g</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground">Biomass</p>
          <p className="text-sm font-bold text-foreground">{batch.biomass}kg</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-coral" />
          <span className="text-xs text-muted-foreground">FCR <strong className="text-foreground">{batch.fcr}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-success" />
          <span className="text-xs text-muted-foreground">Day <strong className="text-foreground">{batch.daysActive}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Mort <strong className="text-danger">{batch.mortality}%</strong></span>
        </div>
      </div>
    </motion.div>
  );
}
