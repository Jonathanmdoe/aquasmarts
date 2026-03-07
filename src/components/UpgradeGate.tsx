import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { TIERS } from "@/hooks/useSubscription";

interface UpgradeGateProps {
  feature: string;
  children: ReactNode;
  fallbackMessage?: string;
}

export default function UpgradeGate({ feature, children, fallbackMessage }: UpgradeGateProps) {
  const { hasAccess, requiredTierFor } = useFeatureAccess();
  const navigate = useNavigate();

  if (hasAccess(feature)) return <>{children}</>;

  const requiredTier = requiredTierFor(feature);
  const tierName = requiredTier ? TIERS[requiredTier].name : "Pro";

  return (
    <div className="bg-card rounded-2xl shadow-card p-6 text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">
        {tierName} Feature
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {fallbackMessage ?? `This feature requires the ${tierName} plan or higher. Upgrade to unlock.`}
      </p>
      <button
        onClick={() => navigate("/subscription")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-4 py-2 rounded-xl"
      >
        Upgrade to {tierName} <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
