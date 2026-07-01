import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Utensils, Droplets, Heart, Fish, ClipboardList, Bell } from "lucide-react";
import { useFarm, useBatches, useFeedingLogs } from "@/hooks/useFarm";
import { useAuth } from "@/hooks/useAuth";
import QuickAction from "@/components/QuickAction";

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: farm } = useFarm();
  const { data: batches } = useBatches();
  const { data: feedings } = useFeedingLogs();

  const activeBatches = batches?.filter((b) => b.status === "active" || b.status === "stocked") ?? [];
  const today = new Date().toDateString();
  const feedingsToday = feedings?.filter((f: any) => new Date(f.feeding_time).toDateString() === today).length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-ocean px-4 pt-10 pb-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">Karibu / Welcome</p>
            <h1 className="text-xl font-bold font-display">
              {user?.user_metadata?.full_name || "Worker"}
            </h1>
            <p className="text-xs opacity-80 mt-0.5">
              {farm?.name ?? "Farm"} · Worker view
            </p>
          </div>
          <button
            onClick={() => navigate("/notifications")}
            className="w-9 h-9 rounded-xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-2">
            <p className="text-[10px] opacity-70">Active batches</p>
            <p className="text-sm font-bold">{activeBatches.length}</p>
          </div>
          <div className="bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-2">
            <p className="text-[10px] opacity-70">Feedings today</p>
            <p className="text-sm font-bold">{feedingsToday}</p>
          </div>
          <div className="bg-primary-foreground/15 backdrop-blur-md rounded-xl px-3 py-2">
            <p className="text-[10px] opacity-70">Ponds</p>
            <p className="text-sm font-bold">{farm?.num_ponds ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Today's Tasks</h2>
          <div className="grid grid-cols-4 gap-2">
            <QuickAction icon={Utensils} label="Feed" onClick={() => navigate("/feeding")} />
            <QuickAction icon={Droplets} label="Water" onClick={() => navigate("/water")} />
            <QuickAction icon={Heart} label="Health" onClick={() => navigate("/health")} />
            <QuickAction icon={Fish} label="Batches" onClick={() => navigate("/batches")} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Active Batches</h2>
          <div className="space-y-2">
            {activeBatches.length === 0 && (
              <div className="bg-card rounded-xl p-4 text-center text-xs text-muted-foreground shadow-card">
                No active batches assigned yet.
              </div>
            )}
            {activeBatches.slice(0, 5).map((b) => (
              <motion.button
                key={b.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/batches`)}
                className="w-full bg-card rounded-xl p-3 shadow-card flex items-center justify-between text-left"
              >
                <div>
                  <p className="text-sm font-semibold">{b.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {b.pond ?? "Pond"} · {b.current_count?.toLocaleString()} fish
                  </p>
                </div>
                <ClipboardList className="w-4 h-4 text-primary" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
