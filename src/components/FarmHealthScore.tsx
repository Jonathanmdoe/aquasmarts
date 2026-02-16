import { motion } from "framer-motion";

interface FarmHealthScoreProps {
  score: number;
}

export default function FarmHealthScore({ score }: FarmHealthScoreProps) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "hsl(152, 60%, 40%)" : score >= 60 ? "hsl(38, 92%, 55%)" : "hsl(0, 72%, 51%)";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Attention";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-2xl p-5 shadow-card flex items-center gap-5"
    >
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-display text-foreground">{score}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Farm Health Score</h3>
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-[11px] text-muted-foreground">Water Quality: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-[11px] text-muted-foreground">Feed Efficiency: Optimal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber" />
            <span className="text-[11px] text-muted-foreground">Mortality: Monitor</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
