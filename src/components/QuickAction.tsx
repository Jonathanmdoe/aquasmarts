import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

export default function QuickAction({ icon: Icon, label, onClick }: QuickActionProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className="w-10 h-10 rounded-xl gradient-ocean flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary-foreground" />
      </div>
      <span className="text-[11px] font-medium text-foreground">{label}</span>
    </motion.button>
  );
}
