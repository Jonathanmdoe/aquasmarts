import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Info, Zap } from "lucide-react";

export interface AlertItem {
  id: string;
  type: "warning" | "danger" | "success" | "info";
  title: string;
  description: string;
  time: string;
}

const iconMap = {
  warning: AlertTriangle,
  danger: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

const styleMap = {
  warning: "bg-amber-light border-amber/30 text-foreground",
  danger: "bg-danger-light border-danger/30 text-foreground",
  success: "bg-success-light border-success/30 text-foreground",
  info: "bg-ocean-surface border-primary/20 text-foreground",
};

const iconStyleMap = {
  warning: "text-amber",
  danger: "text-danger",
  success: "text-success",
  info: "text-primary",
};

export default function AlertCard({ alert }: { alert: AlertItem }) {
  const Icon = iconMap[alert.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-3 rounded-xl border ${styleMap[alert.type]}`}
    >
      <div className={`mt-0.5 ${iconStyleMap[alert.type]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">{alert.title}</p>
          {alert.type === "danger" && <Zap className="w-3 h-3 text-danger animate-pulse" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
      </div>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{alert.time}</span>
    </motion.div>
  );
}
