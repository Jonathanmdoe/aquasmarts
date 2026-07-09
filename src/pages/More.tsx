import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Shield, CreditCard, Crown, Bell, Lock, HelpCircle,
  ClipboardList, Settings as SettingsIcon, Sparkles, ShoppingBag,
  Heart, Droplets, Utensils, ChevronRight, DollarSign, ShoppingCart, Fish,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

type Item = {
  icon: any;
  label: string;
  desc: string;
  to: string;
  tint: string;
  allow: Array<"super_admin" | "owner" | "manager" | "worker">;
};

const ALL_ITEMS: { title: string; items: Item[] }[] = [
  {
    title: "Admin",
    items: [
      { icon: Shield, label: "Admin Dashboard", desc: "Platform overview", to: "/admin", tint: "bg-red-500/10 text-red-600", allow: ["super_admin"] },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: SettingsIcon, label: "Settings", desc: "Profile & farm", to: "/settings", tint: "bg-primary/10 text-primary", allow: ["super_admin","owner","manager","worker"] },
      { icon: CreditCard, label: "Subscription", desc: "Manage your plan", to: "/subscription", tint: "bg-accent/10 text-accent", allow: ["owner"] },
      
    ],
  },
  {
    title: "Operations",
    items: [
      { icon: Fish, label: "Batches", desc: "Fish batches", to: "/batches", tint: "bg-blue-500/10 text-blue-600", allow: ["owner","manager","worker"] },
      { icon: DollarSign, label: "Finance", desc: "P&L & records", to: "/financial", tint: "bg-emerald-600/10 text-emerald-700", allow: ["owner","manager"] },
      { icon: ShoppingCart, label: "Marketplace", desc: "Buy & sell", to: "/marketplace", tint: "bg-sky-500/10 text-sky-600", allow: ["owner","manager"] },
      { icon: ClipboardList, label: "Sales Records", desc: "Buyers & deliveries", to: "/sales", tint: "bg-emerald-500/10 text-emerald-600", allow: ["owner","manager"] },
      { icon: ShoppingBag, label: "My Listings", desc: "Marketplace items", to: "/my-listings", tint: "bg-sky-500/10 text-sky-600", allow: ["owner","manager"] },
      { icon: Sparkles, label: "AI Predictions", desc: "Harvest & cost insights", to: "/ai-predictions", tint: "bg-violet-500/10 text-violet-600", allow: ["owner","manager"] },
    ],
  },
  {
    title: "Farm",
    items: [
      { icon: Droplets, label: "Water Quality", desc: "Pond readings", to: "/water", tint: "bg-cyan-500/10 text-cyan-600", allow: ["owner","manager","worker"] },
      { icon: Utensils, label: "Feeding", desc: "Feed logs", to: "/feeding", tint: "bg-orange-500/10 text-orange-600", allow: ["owner","manager","worker"] },
      { icon: Heart, label: "Health", desc: "Disease & treatment", to: "/health", tint: "bg-rose-500/10 text-rose-600", allow: ["owner","manager","worker"] },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Bell, label: "Notifications", desc: "Alert preferences", to: "/notifications", tint: "bg-yellow-500/10 text-yellow-600", allow: ["super_admin","owner","manager","worker"] },
      { icon: Lock, label: "Security", desc: "Password & 2FA", to: "/security", tint: "bg-slate-500/10 text-slate-600", allow: ["super_admin","owner","manager","worker"] },
      { icon: HelpCircle, label: "Help & Support", desc: "FAQs & contact", to: "/help", tint: "bg-teal-500/10 text-teal-600", allow: ["super_admin","owner","manager","worker"] },
    ],
  },
];

export default function More() {
  const navigate = useNavigate();
  const { primaryRole, isSuperAdmin, loading } = useUserRole();

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
        <h1 className="text-xl font-bold font-display text-primary-foreground">More</h1>
        <p className="text-xs text-primary-foreground/70 mt-1">Explore all features and tools</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-5 pb-4">
        {sections.map((section, sIdx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.05 }}
          >
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
              {section.title}
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
                    <p className="text-sm font-semibold text-foreground leading-tight">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{item.desc}</p>
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
