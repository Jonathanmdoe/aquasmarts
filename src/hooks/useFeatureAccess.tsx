import { useState, useEffect, useCallback } from "react";
import { useSubscription, TIERS } from "@/hooks/useSubscription";

type TierKey = keyof typeof TIERS;

const TIER_LEVEL: Record<TierKey, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

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
const DEV_MODE_EVENT = "aquasmart_dev_mode_change";

export function useFeatureAccess() {
  const { currentTier, loading } = useSubscription();
  const [devMode, setDevModeState] = useState(() => localStorage.getItem(DEV_MODE_KEY) === "true");

  // Listen for changes from other hook instances
  useEffect(() => {
    const handler = () => {
      setDevModeState(localStorage.getItem(DEV_MODE_KEY) === "true");
    };
    window.addEventListener(DEV_MODE_EVENT, handler);
    return () => window.removeEventListener(DEV_MODE_EVENT, handler);
  }, []);

  const setDevMode = useCallback((val: boolean) => {
    localStorage.setItem(DEV_MODE_KEY, String(val));
    setDevModeState(val);
    window.dispatchEvent(new Event(DEV_MODE_EVENT));
  }, []);

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
