import { motion } from "framer-motion";
import { ArrowLeft, Bell, Check, CheckCheck, Trash2, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function Notifications() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: notifs = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const unreadCount = notifs.filter((n: any) => !n.read).length;

  const handleClick = async (n: any) => {
    if (!n.read) await markRead.mutateAsync(n.id);
    if (n.link) navigate(n.link);
  };

  const del = async (id: string) => {
    await supabase.from("notifications" as any).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["notifications_unread"] });
  };

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-primary-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold font-display text-primary-foreground">Notifications</h1>
              <p className="text-xs text-primary-foreground/70 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={() => markAll.mutate()}
              className="flex items-center gap-1 text-xs font-semibold text-primary-foreground bg-primary-foreground/15 px-3 py-1.5 rounded-xl">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 pb-4">
        {isLoading ? (
          <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : notifs.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 shadow-card text-center">
            <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">Alerts about water quality, mortality, orders & payments will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map((n: any, i: number) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`bg-card rounded-2xl p-3 shadow-card flex items-start gap-3 ${!n.read ? "border-l-4 border-primary" : ""}`}
              >
                <button onClick={() => handleClick(n)} className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </button>
                <div className="flex flex-col gap-1">
                  {!n.read && (
                    <button onClick={() => markRead.mutate(n.id)} aria-label="Mark read"
                      className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                  <button onClick={() => del(n.id)} aria-label="Delete"
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
