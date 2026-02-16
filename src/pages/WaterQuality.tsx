import { motion } from "framer-motion";
import { Droplets, Thermometer, Wind, AlertTriangle, ChevronRight } from "lucide-react";

const pondData = [
  {
    id: "P1",
    name: "Pond 1",
    batch: "B001",
    temp: 27.5,
    do: 6.8,
    ph: 7.2,
    ammonia: 0.02,
    nitrite: 0.01,
    status: "good" as const,
  },
  {
    id: "P2",
    name: "Pond 2",
    batch: "B002",
    temp: 28.1,
    do: 5.9,
    ph: 7.5,
    ammonia: 0.04,
    nitrite: 0.02,
    status: "good" as const,
  },
  {
    id: "P3",
    name: "Pond 3",
    batch: "B003",
    temp: 24.2,
    do: 4.2,
    ph: 6.8,
    ammonia: 0.08,
    nitrite: 0.04,
    status: "warning" as const,
  },
  {
    id: "P5",
    name: "Pond 5",
    batch: "B004",
    temp: 29.0,
    do: 7.1,
    ph: 7.4,
    ammonia: 0.01,
    nitrite: 0.01,
    status: "good" as const,
  },
];

const statusColors = {
  good: "bg-success",
  warning: "bg-amber",
  danger: "bg-danger",
};

function ParameterBadge({ label, value, unit, safe }: { label: string; value: number; unit: string; safe: boolean }) {
  return (
    <div className={`rounded-lg p-2 text-center ${safe ? "bg-muted/50" : "bg-danger-light"}`}>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold ${safe ? "text-foreground" : "text-danger"}`}>
        {value}
        <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span>
      </p>
    </div>
  );
}

export default function WaterQuality() {
  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <h1 className="text-xl font-bold font-display text-primary-foreground">Water Quality</h1>
        <p className="text-xs text-primary-foreground/70 mt-1">Real-time environmental monitoring</p>

        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 bg-primary-foreground/10 backdrop-blur rounded-xl p-3 text-center">
            <Thermometer className="w-4 h-4 text-primary-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-primary-foreground">27.2°C</p>
            <p className="text-[10px] text-primary-foreground/60">Avg Temp</p>
          </div>
          <div className="flex-1 bg-primary-foreground/10 backdrop-blur rounded-xl p-3 text-center">
            <Wind className="w-4 h-4 text-primary-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-primary-foreground">6.0 mg/L</p>
            <p className="text-[10px] text-primary-foreground/60">Avg DO</p>
          </div>
          <div className="flex-1 bg-primary-foreground/10 backdrop-blur rounded-xl p-3 text-center">
            <Droplets className="w-4 h-4 text-primary-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-primary-foreground">7.2</p>
            <p className="text-[10px] text-primary-foreground/60">Avg pH</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-3 pb-4">
        {/* Alert */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-light border border-amber/20 rounded-2xl p-3 flex items-start gap-3"
        >
          <AlertTriangle className="w-4 h-4 text-amber mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground">Pond 3: Low Oxygen Alert</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              DO is 4.2 mg/L (critical: &lt;4.0). Increase aeration immediately. Feeding has been auto-paused.
            </p>
          </div>
        </motion.div>

        {/* Pond Cards */}
        {pondData.map((pond, i) => (
          <motion.div
            key={pond.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl p-4 shadow-card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusColors[pond.status]}`} />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{pond.name}</h3>
                  <p className="text-xs text-muted-foreground">Batch {pond.batch}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <ParameterBadge label="Temp" value={pond.temp} unit="°C" safe={pond.temp >= 25 && pond.temp <= 30} />
              <ParameterBadge label="DO" value={pond.do} unit="mg/L" safe={pond.do >= 5} />
              <ParameterBadge label="pH" value={pond.ph} unit="" safe={pond.ph >= 6.5 && pond.ph <= 8.5} />
              <ParameterBadge label="NH₃" value={pond.ammonia} unit="mg/L" safe={pond.ammonia < 0.05} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
