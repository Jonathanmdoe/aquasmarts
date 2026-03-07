import { Crown, Zap, Building2 } from "lucide-react";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

const tierConfig = {
  free: { icon: Zap, bg: "bg-muted", text: "text-muted-foreground" },
  pro: { icon: Crown, bg: "bg-secondary/20", text: "text-secondary" },
  enterprise: { icon: Building2, bg: "bg-primary/20", text: "text-primary" },
};

export default function PlanBadge() {
  const { currentTier, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) return null;

  const config = tierConfig[currentTier];
  const Icon = config.icon;

  return (
    <button
      onClick={() => navigate("/subscription")}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg ${config.bg} backdrop-blur-md`}
    >
      <Icon className={`w-3 h-3 ${config.text}`} />
      <span className={`text-[10px] font-semibold ${config.text}`}>
        {TIERS[currentTier].name}
      </span>
    </button>
  );
}
