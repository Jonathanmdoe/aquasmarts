import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Package, AlertTriangle, ShieldCheck, Wallet, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ICONS: Record<string, any> = {
  order_placed: Package, order_shipped: Package, order_delivered: Package,
  dispute: AlertTriangle, kyc_approved: ShieldCheck, payment: Wallet,
};

export default function MarketplaceNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: notifs = [] } = useQuery({
    queryKey: ["mp_notifs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("marketplace_notifications" as any).select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(100);
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`mp-notifs-${user.id}`).on("postgres_changes",
      { event: "*", schema: "public", table: "marketplace_notifications", filter: `user_id=eq.${user.id}` },
      () => qc.invalidateQueries({ queryKey: ["mp_notifs"] })).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const markRead = async (id: string) => {
    await supabase.from("marketplace_notifications" as any).update({ read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["mp_notifs"] });
    qc.invalidateQueries({ queryKey: ["mp_notif_unread"] });
  };

  const markAll = async () => {
    await supabase.from("marketplace_notifications" as any).update({ read: true }).eq("user_id", user!.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["mp_notifs"] });
    qc.invalidateQueries({ queryKey: ["mp_notif_unread"] });
  };

  return (
    <div className="min-h-screen pb-6">
      <div className="gradient-ocean px-4 pt-10 pb-5 flex items-start justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-primary-foreground/80 mb-2 flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
          <h1 className="text-xl font-bold font-display text-primary-foreground">Notifications</h1>
        </div>
        <button onClick={markAll} className="text-[11px] font-medium bg-primary-foreground/15 text-primary-foreground rounded-full px-3 py-1.5 flex items-center gap-1">
          <CheckCheck className="w-3 h-3" /> Mark all read
        </button>
      </div>

      <div className="px-4 pt-3 space-y-2">
        {notifs.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        ) : notifs.map((n: any, i: number) => {
          const Icon = ICONS[n.type] || Bell;
          const tone = n.type.includes("dispute") ? "warning" : n.type.includes("delivered") || n.type.includes("approved") ? "success" : "primary";
          const colors: any = { warning: "bg-warning/15 text-warning", success: "bg-success-light text-success", primary: "bg-primary/10 text-primary" };
          return (
            <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              key={n.id} onClick={() => markRead(n.id)}
              className={`w-full text-left bg-card rounded-2xl p-3 shadow-card flex items-start gap-3 ${!n.read && "ring-1 ring-primary/30"}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[tone]}`}><Icon className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{n.title}</p>
                {n.body && <p className="text-[11px] text-muted-foreground">{n.body}</p>}
                <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
