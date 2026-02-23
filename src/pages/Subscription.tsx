import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Zap, Building2, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";

const tierIcons = {
  free: Zap,
  pro: Crown,
  enterprise: Building2,
};

const tierAccents = {
  free: "border-border",
  pro: "border-secondary ring-2 ring-secondary/20",
  enterprise: "border-primary ring-2 ring-primary/20",
};

export default function Subscription() {
  const { currentTier, subscribed, subscriptionEnd, loading, checkout, manageSubscription, refresh } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleCheckout = async (tierKey: string) => {
    const tier = TIERS[tierKey as keyof typeof TIERS];
    if (tier.price === 0) return;
    setCheckoutLoading(tierKey);
    try {
      await checkout(tier.price_id);
    } catch {
      toast({ title: "Error", description: "Failed to start checkout. Please try again.", variant: "destructive" });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManage = async () => {
    try {
      await manageSubscription();
    } catch {
      toast({ title: "Error", description: "Failed to open subscription management.", variant: "destructive" });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    toast({ title: "Refreshed", description: "Subscription status updated." });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Subscription</h2>
          <p className="text-sm text-muted-foreground">
            {subscribed
              ? `Your ${TIERS[currentTier].name} plan renews ${subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString() : "soon"}`
              : "Choose a plan that fits your farm"}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Manage subscription */}
      {subscribed && currentTier !== "free" && (
        <Button variant="outline" className="w-full gap-2" onClick={handleManage}>
          <ExternalLink className="w-4 h-4" />
          Manage Subscription
        </Button>
      )}

      {/* Tier Cards */}
      <div className="space-y-4">
        {(Object.entries(TIERS) as [string, typeof TIERS[keyof typeof TIERS]][]).map(([key, tier], i) => {
          const Icon = tierIcons[key as keyof typeof tierIcons];
          const isCurrentPlan = currentTier === key;
          const isPopular = key === "pro";

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className={`relative rounded-2xl border-2 bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover ${tierAccents[key as keyof typeof tierAccents]}`}
            >
              {isPopular && (
                <Badge className="absolute -top-2.5 right-4 bg-secondary text-secondary-foreground text-xs px-3">
                  Most Popular
                </Badge>
              )}

              {isCurrentPlan && (
                <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-xs px-3">
                  Your Plan
                </Badge>
              )}

              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${isPopular ? "bg-secondary/10" : "bg-muted"}`}>
                  <Icon className={`w-5 h-5 ${isPopular ? "text-secondary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-foreground">
                      ${tier.price}
                    </span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : tier.price === 0 ? (
                  <Button variant="outline" className="w-full" disabled>
                    Free Forever
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${isPopular ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground" : ""}`}
                    onClick={() => handleCheckout(key)}
                    disabled={checkoutLoading === key}
                  >
                    {checkoutLoading === key ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      `Upgrade to ${tier.name}`
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
