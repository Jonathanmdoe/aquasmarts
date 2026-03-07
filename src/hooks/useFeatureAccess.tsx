import { useState, useEffect } from "react";
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

const DEV_MODE_KEY = "aquasmart_dev_mode";

export function useFeatureAccess() {
  const { currentTier, loading } = useSubscription();
  const [devMode, setDevMode] = useState(() => localStorage.getItem(DEV_MODE_KEY) === "true");

  useEffect(() => {
    localStorage.setItem(DEV_MODE_KEY, String(devMode));
  }, [devMode]);

  const hasAccess = (feature: string): boolean => {
    if (devMode) return true;
    const requiredTier = FEATURE_TIERS[feature];
    if (!requiredTier) return true;
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
    devMode,
    setDevMode,
  };
}
