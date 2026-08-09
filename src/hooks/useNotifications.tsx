import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications"] });
          qc.invalidateQueries({ queryKey: ["notifications_unread"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    enabled: !!user,
  });
}

export function useUnreadNotificationCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications_unread", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("read", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 60000,
    refetchInterval: 120000,
    refetchIntervalInBackground: false,

  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications" as any).update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications_unread"] });
    },
  });
}

export function useMarkAllRead() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications" as any).update({ read: true })
        .eq("user_id", user!.id).eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications_unread"] });
    },
  });
}
