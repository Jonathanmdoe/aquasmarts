import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const TIERS = {
  free: {
    name: "Free",
    price_id: "price_1T3rlT5QBKHmumrV3gx7DGpR",
    product_id: "prod_U1vc1eRNCiKxqL",
    price: 0,
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

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      let currentTier: TierKey = "free";
      if (data?.subscribed && data?.product_id) {
        const match = Object.entries(TIERS).find(
          ([, t]) => t.product_id === data.product_id
        );
        if (match) currentTier = match[0] as TierKey;
      }

      setState({
        subscribed: data?.subscribed ?? false,
        productId: data?.product_id ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
        currentTier,
        loading: false,
      });
    } catch (err) {
      console.error("Error checking subscription:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
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

  return { ...state, checkout, manageSubscription, refresh: checkSubscription };
}
