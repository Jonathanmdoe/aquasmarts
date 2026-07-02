import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useFarm() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["farm", user?.id],
    queryFn: async () => {
      // 1. Farm the user owns
      const { data, error } = await supabase
        .from("farms")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;

      // 2. Farm the user is a team member of (manager/worker)
      const { data: tm } = await supabase
        .from("team_members")
        .select("farm_id")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      if (!tm?.farm_id) return null;
      const { data: teamFarm } = await supabase
        .from("farms")
        .select("*")
        .eq("id", tm.farm_id)
        .maybeSingle();
      return teamFarm ?? null;
    },
    enabled: !!user,
  });
}

export function useBatches() {
  const { data: farm } = useFarm();

  return useQuery({
    queryKey: ["batches", farm?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fish_batches")
        .select("*")
        .eq("farm_id", farm!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!farm?.id,
  });
}

export function useFeedingLogs() {
  const { data: batches } = useBatches();
  const batchIds = batches?.map((b) => b.id) ?? [];

  return useQuery({
    queryKey: ["feeding_logs", batchIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feeding_logs")
        .select("*, fish_batches(name, pond, species)")
        .in("batch_id", batchIds)
        .order("feeding_time", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: batchIds.length > 0,
  });
}

export function useWaterReadings() {
  const { data: batches } = useBatches();
  const batchIds = batches?.map((b) => b.id) ?? [];

  return useQuery({
    queryKey: ["water_readings", batchIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_readings")
        .select("*, fish_batches(name, pond)")
        .in("batch_id", batchIds)
        .order("reading_time", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: batchIds.length > 0,
  });
}

export function useHealthRecords() {
  const { data: batches } = useBatches();
  const batchIds = batches?.map((b) => b.id) ?? [];

  return useQuery({
    queryKey: ["health_records", batchIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_records")
        .select("*, fish_batches(name)")
        .in("batch_id", batchIds)
        .order("recorded_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: batchIds.length > 0,
  });
}

export function useFinancialRecords() {
  const { data: farm } = useFarm();

  return useQuery({
    queryKey: ["financial_records", farm?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_records")
        .select("*, fish_batches(name)")
        .eq("farm_id", farm!.id)
        .order("transaction_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!farm?.id,
  });
}

export function useBiosecurityChecks() {
  const { data: farm } = useFarm();

  return useQuery({
    queryKey: ["biosecurity_checks", farm?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biosecurity_checks")
        .select("*")
        .eq("farm_id", farm!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!farm?.id,
  });
}
