import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "./useFarm";
import { useToast } from "./use-toast";

export interface HatcheryPond {
  id: string;
  farm_id: string;
  name: string;
  capacity: number | null;
  purpose: string;
  status: string;
  notes: string | null;
}

export interface Brooder {
  id: string;
  farm_id: string;
  brooder_code: string;
  species: string;
  quantity: number;
  male_count: number | null;
  female_count: number | null;
  stocking_date: string;
  pond_name: string;
  avg_weight_g: number;
  health_status: string;
  staff: string | null;
  notes: string | null;
}

export interface HatcheryBatch {
  id: string;
  farm_id: string;
  batch_code: string;
  brooder_id: string | null;
  collected_date: string;
  total_collection: number;
  pond_stocked: string;
  grading_date: string | null;
  total_graded: number;
  survival_rate: number;
  sold_amount: number;
  restocked_amount: number;
  status: string;
  staff: string | null;
  notes: string | null;
}

export function useHatcheryPonds() {
  const { data: farm } = useFarm();
  return useQuery({
    queryKey: ["hatchery_ponds", farm?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hatchery_ponds")
        .select("*")
        .eq("farm_id", farm!.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as HatcheryPond[];
    },
    enabled: !!farm?.id,
  });
}

export function useBrooders() {
  const { data: farm } = useFarm();
  return useQuery({
    queryKey: ["brooders", farm?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brooders")
        .select("*")
        .eq("farm_id", farm!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Brooder[];
    },
    enabled: !!farm?.id,
  });
}

export function useHatcheryBatches() {
  const { data: farm } = useFarm();
  return useQuery({
    queryKey: ["hatchery_production", farm?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hatchery_production")
        .select("*")
        .eq("farm_id", farm!.id)
        .order("collected_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as HatcheryBatch[];
    },
    enabled: !!farm?.id,
  });
}

/** Friendly messages for the database rules that protect hatchery data. */
export function hatcheryErrorMessage(message: string) {
  if (message.includes("hatchery_production_active_pond_key"))
    return "That pond already holds a live fry batch. Pick an empty pond or sell/close the current batch first.";
  if (message.includes("brooders_active_pond_key"))
    return "That pond already has an active brooder group. Rest or move it before stocking another.";
  if (message.includes("hatchery_production_farm_code_key"))
    return "A production batch with this code already exists.";
  if (message.includes("brooders_farm_code_key"))
    return "A brooder group with this ID already exists.";
  if (message.includes("hatchery_ponds_farm_name_key"))
    return "A pond with this name already exists.";
  return message;
}

function useHatcheryMutation<T>(
  table: "hatchery_ponds" | "brooders" | "hatchery_production",
  queryKey: string,
  successTitle: string
) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: farm } = useFarm();

  return useMutation({
    mutationFn: async (payload: T & { id?: string }) => {
      if (!farm?.id) throw new Error("No farm found for this account.");
      const { id, ...values } = payload as any;
      const query = id
        ? supabase.from(table).update(values).eq("id", id)
        : supabase.from(table).insert({ ...values, farm_id: farm.id });
      const { error } = await query;
      if (error) throw new Error(hatcheryErrorMessage(error.message));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      toast({ title: successTitle });
    },
    onError: (e: Error) =>
      toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });
}

export const useSaveHatcheryPond = () =>
  useHatcheryMutation<Partial<HatcheryPond>>("hatchery_ponds", "hatchery_ponds", "Pond saved");
export const useSaveBrooder = () =>
  useHatcheryMutation<Partial<Brooder>>("brooders", "brooders", "Brooder group saved");
export const useSaveHatcheryBatch = () =>
  useHatcheryMutation<Partial<HatcheryBatch>>("hatchery_production", "hatchery_production", "Production batch saved");

export function useDeleteHatcheryRow(
  table: "hatchery_ponds" | "brooders" | "hatchery_production",
  queryKey: string
) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      toast({ title: "Record deleted" });
    },
    onError: (e: Error) =>
      toast({ title: "Could not delete", description: e.message, variant: "destructive" }),
  });
}
