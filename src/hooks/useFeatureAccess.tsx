import { useState, useEffect, useSyncExternalStore, useCallback } from "react";
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

// Shared external store so all components react to dev mode changes
const listeners = new Set<() => void>();
function getDevModeSnapshot(): boolean {
  return localStorage.getItem(DEV_MODE_KEY) === "true";
}
function subscribeDevMode(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function setDevModeValue(val: boolean) {
  localStorage.setItem(DEV_MODE_KEY, String(val));
  listeners.forEach((cb) => cb());
}

export function useFeatureAccess() {
  const { currentTier, loading } = useSubscription();
  const devMode = useSyncExternalStore(subscribeDevMode, getDevModeSnapshot);

  const setDevMode = useCallback((val: boolean) => {
    setDevModeValue(val);
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
