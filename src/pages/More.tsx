import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Shield, CreditCard, Crown, Bell, Lock, HelpCircle,
  ClipboardList, Settings as SettingsIcon, Sparkles, ShoppingBag,
  Heart, Droplets, Utensils, ChevronRight, DollarSign, ShoppingCart, Fish, LineChart, Egg,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useI18n } from "@/i18n";

type Item = {
  icon: any;
  labelKey: string;
  descKey: string;
  to: string;
  tint: string;
  allow: Array<"super_admin" | "owner" | "manager" | "worker">;
};

const ALL_ITEMS: { titleKey: string; items: Item[] }[] = [
  {
    titleKey: "more.section.admin",
    items: [
      { icon: Shield, labelKey: "more.adminDashboard", descKey: "more.adminDashboard.desc", to: "/admin", tint: "bg-red-500/10 text-red-600", allow: ["super_admin"] },
    ],
  },
  {
    titleKey: "more.section.account",
    items: [
      { icon: SettingsIcon, labelKey: "more.settings", descKey: "more.settings.desc", to: "/settings", tint: "bg-primary/10 text-primary", allow: ["super_admin","owner","manager","worker"] },
      { icon: CreditCard, labelKey: "more.subscription", descKey: "more.subscription.desc", to: "/subscription", tint: "bg-accent/10 text-accent", allow: ["owner"] },
      
    ],
  },
  {
    titleKey: "more.section.operations",
    items: [
      { icon: Fish, labelKey: "more.batches", descKey: "more.batches.desc", to: "/batches", tint: "bg-blue-500/10 text-blue-600", allow: ["owner","manager","worker"] },
      { icon: DollarSign, labelKey: "more.finance", descKey: "more.finance.desc", to: "/financial", tint: "bg-emerald-600/10 text-emerald-700", allow: ["owner","manager"] },
      { icon: ShoppingCart, labelKey: "more.marketplace", descKey: "more.marketplace.desc", to: "/marketplace", tint: "bg-sky-500/10 text-sky-600", allow: ["owner","manager"] },
      { icon: ClipboardList, labelKey: "more.sales", descKey: "more.sales.desc", to: "/sales", tint: "bg-emerald-500/10 text-emerald-600", allow: ["owner","manager"] },
      { icon: ShoppingBag, labelKey: "more.listings", descKey: "more.listings.desc", to: "/my-listings", tint: "bg-sky-500/10 text-sky-600", allow: ["owner","manager"] },
      { icon: Sparkles, labelKey: "more.ai", descKey: "more.ai.desc", to: "/ai-predictions", tint: "bg-violet-500/10 text-violet-600", allow: ["owner","manager"] },
    ],
  },
  {
    titleKey: "more.section.farm",
    items: [
      { icon: Egg, labelKey: "more.hatchery", descKey: "more.hatchery.desc", to: "/hatchery", tint: "bg-amber-500/10 text-amber-600", allow: ["owner","manager","worker"] },
      { icon: LineChart, labelKey: "more.growth", descKey: "more.growth.desc", to: "/growth", tint: "bg-indigo-500/10 text-indigo-600", allow: ["owner","manager","worker"] },
      { icon: Droplets, labelKey: "more.water", descKey: "more.water.desc", to: "/water", tint: "bg-cyan-500/10 text-cyan-600", allow: ["owner","manager","worker"] },
      { icon: Utensils, labelKey: "more.feeding", descKey: "more.feeding.desc", to: "/feeding", tint: "bg-orange-500/10 text-orange-600", allow: ["owner","manager","worker"] },
      { icon: Heart, labelKey: "more.health", descKey: "more.health.desc", to: "/health", tint: "bg-rose-500/10 text-rose-600", allow: ["owner","manager","worker"] },
    ],
  },
  {
    titleKey: "more.section.preferences",
    items: [
      { icon: Bell, labelKey: "more.notifications", descKey: "more.notifications.desc", to: "/notifications", tint: "bg-yellow-500/10 text-yellow-600", allow: ["super_admin","owner","manager","worker"] },
      { icon: Lock, labelKey: "more.security", descKey: "more.security.desc", to: "/security", tint: "bg-slate-500/10 text-slate-600", allow: ["super_admin","owner","manager","worker"] },
      { icon: HelpCircle, labelKey: "more.help", descKey: "more.help.desc", to: "/help", tint: "bg-teal-500/10 text-teal-600", allow: ["super_admin","owner","manager","worker"] },
    ],
  },
];

export default function More() {
  const navigate = useNavigate();
  const { primaryRole, isSuperAdmin, loading } = useUserRole();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = (isSuperAdmin ? "super_admin" : (primaryRole ?? "owner")) as
    "super_admin" | "owner" | "manager" | "worker";

  const sections = ALL_ITEMS
    .map((s) => ({ ...s, items: s.items.filter((i) => i.allow.includes(role)) }))
    .filter((s) => s.items.length > 0);

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <h1 className="text-xl font-bold font-display text-primary-foreground">{t("more.title")}</h1>
        <p className="text-xs text-primary-foreground/70 mt-1">{t("more.subtitle")}</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-5 pb-4">
        {sections.map((section, sIdx) => (
          <motion.div
            key={section.titleKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.05 }}
          >
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
              {t(section.titleKey)}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {section.items.map((item) => (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className="bg-card rounded-2xl shadow-card p-3.5 text-left flex flex-col gap-2 active:scale-[0.98] transition-transform"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.tint}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground leading-tight">{t(item.labelKey)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{t(item.descKey)}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground self-end" />
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
