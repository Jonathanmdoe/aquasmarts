import { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  color: "primary" | "teal" | "coral" | "amber" | "success";
}

const bgMap = {
  primary: "bg-ocean-surface",
  teal: "bg-teal-light",
  coral: "bg-coral-light",
  amber: "bg-amber-light",
  success: "bg-success-light",
};

const iconBgMap = {
  primary: "bg-primary text-primary-foreground",
  teal: "bg-teal text-secondary-foreground",
  coral: "bg-coral text-secondary-foreground",
  amber: "bg-amber text-accent-foreground",
  success: "bg-success text-secondary-foreground",
};

export default function StatCard({ icon, label, value, change, trend, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl p-4 ${bgMap[color]} shadow-card`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBgMap[color]}`}>
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend === "up" ? "bg-success/10 text-success" :
            trend === "down" ? "bg-danger/10 text-danger" :
            "bg-muted text-muted-foreground"
          }`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold font-display text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}
