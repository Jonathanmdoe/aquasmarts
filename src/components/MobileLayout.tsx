import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Fish,
  Heart,
  ShoppingCart,
  DollarSign,
  MoreHorizontal,
  Users,
  Flag,
  LifeBuoy,
} from "lucide-react";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import RoleBadge from "@/components/RoleBadge";
import { useI18n } from "@/i18n";

import { useUserRole } from "@/hooks/useUserRole";

const ownerTabs = [
  { path: "/", icon: LayoutDashboard, labelKey: "nav.home" },
  { path: "/batches", icon: Fish, labelKey: "nav.batches" },
  { path: "/financial", icon: DollarSign, labelKey: "nav.finance" },
  { path: "/marketplace", icon: ShoppingCart, labelKey: "nav.market" },
  { path: "/more", icon: MoreHorizontal, labelKey: "nav.more" },
];

const workerTabs = [
  { path: "/worker", icon: LayoutDashboard, labelKey: "nav.home" },
  { path: "/batches", icon: Fish, labelKey: "nav.batches" },
  { path: "/feeding", icon: Fish, labelKey: "nav.feed" },
  { path: "/health", icon: Heart, labelKey: "nav.health" },
  { path: "/more", icon: MoreHorizontal, labelKey: "nav.more" },
];

const adminTabs = [
  { path: "/admin", icon: LayoutDashboard, labelKey: "nav.console" },
  { path: "/admin?tab=users", icon: Users, labelKey: "nav.users" },
  { path: "/admin?tab=moderation", icon: Flag, labelKey: "nav.moderate" },
  { path: "/admin?tab=support", icon: LifeBuoy, labelKey: "nav.tickets" },
  { path: "/more", icon: MoreHorizontal, labelKey: "nav.more" },
];

export default function MobileLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { data: unread = 0 } = useUnreadNotificationCount();
  const { isWorker, isOwner, isManager, isSuperAdmin, loading: rolesLoading } = useUserRole();
  const tabs = isSuperAdmin
    ? adminTabs
    : isWorker && !isOwner && !isManager
      ? workerTabs
      : ownerTabs;

  const isActive = (path: string) => location.pathname + location.search === path;




  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background">
      <RoleBadge />
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50 safe-bottom"
        style={{ boxShadow: "var(--shadow-nav)" }}>
        <div className="max-w-md mx-auto flex items-center justify-around px-1 py-1.5">
          {(rolesLoading ? [] : tabs).map((tab) => {

            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-ocean-surface rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative">
                  <tab.icon
                    className={`relative z-10 w-5 h-5 transition-colors ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  {tab.path === "/more" && unread > 0 && (
                    <span className="absolute -top-1.5 -right-2 z-20 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>
                <span
                  className={`relative z-10 text-[9px] font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {t(tab.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
