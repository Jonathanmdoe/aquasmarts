import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "./useFarm";
import type { AlertItem } from "@/components/AlertCard";

export function useSmartAlerts() {
  const { data: farm } = useFarm();
  const queryClient = useQueryClient();
  const [realtimeAlerts, setRealtimeAlerts] = useState<any[]>([]);

  const query = useQuery({
    queryKey: ["smart_alerts", farm?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smart_alerts")
        .select("*")
        .eq("farm_id", farm!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!farm?.id,
  });

  // Real-time subscription
  useEffect(() => {
    if (!farm?.id) return;

    const channel = supabase
      .channel("smart-alerts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "smart_alerts",
          filter: `farm_id=eq.${farm.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["smart_alerts", farm.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farm?.id, queryClient]);

  const alerts: AlertItem[] = (query.data ?? []).map((a) => ({
    id: a.id,
    type: a.type as AlertItem["type"],
    title: a.title,
    description: a.description ?? "",
    time: formatTimeAgo(a.created_at),
  }));

  return { alerts, isLoading: query.isLoading, refetch: query.refetch };
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
