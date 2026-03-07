import { useSubscription, TIERS } from "@/hooks/useSubscription";

type TierKey = keyof typeof TIERS;

const TIER_LEVEL: Record<TierKey, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

// Features and their minimum required tier
const FEATURE_TIERS: Record<string, TierKey> = {
  ai_predictions: "pro",
  financial_analytics: "pro",
  team_management: "pro",
  marketplace: "pro",
  unlimited_ponds: "pro",
  custom_integrations: "enterprise",
  white_label: "enterprise",
};

export function useFeatureAccess() {
  const { currentTier, loading } = useSubscription();

  const hasAccess = (feature: string): boolean => {
    const requiredTier = FEATURE_TIERS[feature];
    if (!requiredTier) return true; // Unknown features are allowed
    return TIER_LEVEL[currentTier] >= TIER_LEVEL[requiredTier];
  };

  const requiredTierFor = (feature: string): TierKey | null => {
    return FEATURE_TIERS[feature] ?? null;
  };

  return {
    hasAccess,
    requiredTierFor,
    currentTier,
    tierName: TIERS[currentTier].name,
    loading,
  };
}
