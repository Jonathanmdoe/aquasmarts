import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const TIERS = {
  free: {
    name: "Free",
    price_id: "price_1T3rlT5QBKHmumrV3gx7DGpR",
    product_id: "prod_U1vc1eRNCiKxqL",
    price: 0,
    price_tzs: 0,
    features: [
      "Up to 2 ponds",
      "Basic water monitoring",
      "Manual feeding logs",
      "Community support",
    ],
  },
  pro: {
    name: "Pro",
    price_id: "price_1T3rli5QBKHmumrVmhjCZjeP",
    product_id: "prod_U1vczhh3nu9qex",
    price: 29.99,
    price_tzs: 79000,
    features: [
      "Unlimited ponds",
      "AI predictions & alerts",
      "Team management (5 members)",
      "Financial analytics",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price_id: "price_1T3rm35QBKHmumrVVpM7NNrs",
    product_id: "prod_U1vd1S5APQaaOl",
    price: 99.99,
    price_tzs: 259000,
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "White-label options",
    ],
  },
} as const;


type TierKey = keyof typeof TIERS;

export type PricesTzs = Record<"free" | "pro" | "enterprise", number>;

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  currentTier: TierKey;
  loading: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    currentTier: "free",
    loading: true,
  });

  const [pricesTzs, setPricesTzs] = useState<PricesTzs>({
    free: 0,
    pro: TIERS.pro.price_tzs,
    enterprise: TIERS.enterprise.price_tzs,
  });

  // Live plan prices (TZS) configured by the platform admin.
  const loadPrices = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke("manual-payment", {
        body: { action: "config" },
      });
      const p = data?.prices_tzs;
      if (p) {
        setPricesTzs({
          free: 0,
          pro: Number(p.pro) || TIERS.pro.price_tzs,
          enterprise: Number(p.enterprise) || TIERS.enterprise.price_tzs,
        });
      }
    } catch {
      /* keep defaults */
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const TIER_ORDER: TierKey[] = ["free", "pro", "enterprise"];

    // Plan granted manually by a platform admin (subscribers_cache)
    let adminTier: TierKey = "free";
    try {
      const { data: cached } = await supabase
        .from("subscribers_cache")
        .select("plan, subscribed")
        .eq("user_id", user.id)
        .maybeSingle();
      const plan = (cached?.plan ?? "free") as string;
      if (plan === "enterprise") adminTier = "enterprise";
      else if (plan === "pro" || plan === "basic") adminTier = "pro";
    } catch (err) {
      console.error("Error reading plan cache:", err);
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      let stripeTier: TierKey = "free";
      if (data?.subscribed && data?.product_id) {
        const match = Object.entries(TIERS).find(
          ([, t]) => t.product_id === data.product_id
        );
        if (match) stripeTier = match[0] as TierKey;
      }

      const currentTier =
        TIER_ORDER.indexOf(adminTier) > TIER_ORDER.indexOf(stripeTier) ? adminTier : stripeTier;

      setState({
        subscribed: (data?.subscribed ?? false) || adminTier !== "free",
        productId: data?.product_id ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
        currentTier,
        loading: false,
      });
    } catch (err) {
      console.error("Error checking subscription:", err);
      setState((s) => ({
        ...s,
        subscribed: adminTier !== "free",
        currentTier: adminTier,
        loading: false,
      }));
    }
  }, [user]);


  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  useEffect(() => {
    checkSubscription();
    // Re-check occasionally, but only while the tab is actually visible so we
    // don't keep the app in a permanent loading/refetch loop.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") checkSubscription();
    }, 300000);
    return () => clearInterval(interval);
  }, [checkSubscription]);


  const checkout = async (priceId: string) => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  const manageSubscription = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  return {
    ...state,
    pricesTzs,
    checkout,
    manageSubscription,
    refresh: async () => {
      await Promise.all([checkSubscription(), loadPrices()]);
    },
  };
}
