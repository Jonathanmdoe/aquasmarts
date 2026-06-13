import { motion } from "framer-motion";
import { Droplets, Thermometer, Wind, ChevronRight, Plus, X } from "lucide-react";
import { useWaterReadings, useBatches } from "@/hooks/useFarm";
import AddWaterReadingForm from "@/components/forms/AddWaterReadingForm";
import { useSearchParams } from "react-router-dom";

type Status = "safe" | "caution" | "danger";

function rate(value: number | null | undefined, ok: [number, number], warn: [number, number]): Status {
  if (value == null) return "safe";
  if (value >= ok[0] && value <= ok[1]) return "safe";
  if (value >= warn[0] && value <= warn[1]) return "caution";
  return "danger";
}

const worst = (s: Status[]): Status =>
  s.includes("danger") ? "danger" : s.includes("caution") ? "caution" : "safe";

const statusStyles: Record<Status, string> = {
  safe: "bg-success-light text-success border-success/30",
  caution: "bg-amber-light text-amber border-amber/30",
  danger: "bg-danger-light text-danger border-danger/30",
};

function StatusPill({ status }: { status: Status }) {
  const label = status === "safe" ? "Safe" : status === "caution" ? "Caution" : "Danger";
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyles[status]}`}>
      {label}
    </span>
  );
}

function ParameterBadge({ label, value, unit, status }: { label: string; value: number | null; unit: string; status: Status }) {
  const bg = status === "safe" ? "bg-muted/50" : status === "caution" ? "bg-amber-light" : "bg-danger-light";
  const fg = status === "safe" ? "text-foreground" : status === "caution" ? "text-amber" : "text-danger";
  return (
    <div className={`rounded-lg p-2 text-center ${bg}`}>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold ${fg}`}>
        {value?.toFixed(1) ?? "—"}
        <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span>
      </p>
    </div>
  );
}

export default function WaterQuality() {
  const { data: readings, isLoading } = useWaterReadings();
  const { data: batches } = useBatches();

  // Group latest reading per batch
  const latestByBatch = new Map<string, typeof readings extends (infer U)[] ? U : never>();
  readings?.forEach((r) => {
    if (!latestByBatch.has(r.batch_id)) latestByBatch.set(r.batch_id, r);
  });
  const pondReadings = Array.from(latestByBatch.values());

  const avgTemp = pondReadings.length > 0
    ? pondReadings.reduce((s, r) => s + (r.temperature ?? 0), 0) / pondReadings.length
    : 0;
  const avgDO = pondReadings.length > 0
    ? pondReadings.reduce((s, r) => s + (r.dissolved_oxygen ?? 0), 0) / pondReadings.length
    : 0;
  const avgPH = pondReadings.length > 0
    ? pondReadings.reduce((s, r) => s + (r.ph ?? 0), 0) / pondReadings.length
    : 0;

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Water Quality</h1>
            <p className="text-xs text-primary-foreground/70 mt-1">Real-time environmental monitoring</p>
          </div>
          <AddWaterReadingForm />
        </div>
        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 bg-primary-foreground/10 backdrop-blur rounded-xl p-3 text-center">
            <Thermometer className="w-4 h-4 text-primary-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-primary-foreground">{avgTemp.toFixed(1)}°C</p>
            <p className="text-[10px] text-primary-foreground/60">Avg Temp</p>
          </div>
          <div className="flex-1 bg-primary-foreground/10 backdrop-blur rounded-xl p-3 text-center">
            <Wind className="w-4 h-4 text-primary-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-primary-foreground">{avgDO.toFixed(1)} mg/L</p>
            <p className="text-[10px] text-primary-foreground/60">Avg DO</p>
          </div>
          <div className="flex-1 bg-primary-foreground/10 backdrop-blur rounded-xl p-3 text-center">
            <Droplets className="w-4 h-4 text-primary-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-primary-foreground">{avgPH.toFixed(1)}</p>
            <p className="text-[10px] text-primary-foreground/60">Avg pH</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-3 pb-4">
        {isLoading ? (
          <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : pondReadings.length === 0 ? (
          <div className="bg-card rounded-xl p-6 shadow-card text-center">
            <Droplets className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No water readings yet. Log your first test!</p>
          </div>
        ) : (
          pondReadings.map((r, i) => {
            const batch = batches?.find((b) => b.id === r.batch_id);
            const tempStatus = rate(r.temperature, [25, 30], [22, 32]);
            const doStatus: Status = r.dissolved_oxygen == null ? "safe"
              : r.dissolved_oxygen >= 5 ? "safe"
              : r.dissolved_oxygen >= 3 ? "caution" : "danger";
            const phStatus = rate(r.ph, [6.5, 8.5], [6.0, 9.0]);
            const nh3Status: Status = r.ammonia == null ? "safe"
              : r.ammonia < 0.05 ? "safe"
              : r.ammonia < 0.1 ? "caution" : "danger";
            const overall = worst([tempStatus, doStatus, phStatus, nh3Status]);
            const dotColor = overall === "safe" ? "bg-success" : overall === "caution" ? "bg-amber" : "bg-danger";
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${dotColor}`} />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{batch?.pond ?? "Pond"}</h3>
                      <p className="text-xs text-muted-foreground">{batch?.name ?? "Batch"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={overall} />
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <ParameterBadge label="Temp" value={r.temperature} unit="°C" status={tempStatus} />
                  <ParameterBadge label="DO" value={r.dissolved_oxygen} unit="mg/L" status={doStatus} />
                  <ParameterBadge label="pH" value={r.ph} unit="" status={phStatus} />
                  <ParameterBadge label="NH₃" value={r.ammonia} unit="mg/L" status={nh3Status} />
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
