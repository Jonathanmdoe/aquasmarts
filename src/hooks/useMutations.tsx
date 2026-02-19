import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFarm } from "./useFarm";

export function useAddBatch() {
  const qc = useQueryClient();
  const { data: farm } = useFarm();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: { name: string; species: string; pond: string; initial_count: number; stock_date: string }) => {
      if (!farm) throw new Error("Please complete farm setup first");
      const { error } = await supabase.from("fish_batches").insert({
        farm_id: farm.id,
        name: values.name,
        species: values.species,
        pond: values.pond,
        initial_count: values.initial_count,
        current_count: values.initial_count,
        stock_date: values.stock_date,
        status: "stocked",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      toast({ title: "Batch added!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useAddFeedingLog() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: { batch_id: string; feed_type: string; amount_kg: number; notes?: string }) => {
      const { error } = await supabase.from("feeding_logs").insert({
        batch_id: values.batch_id,
        feed_type: values.feed_type,
        amount_kg: values.amount_kg,
        notes: values.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feeding_logs"] });
      toast({ title: "Feeding logged!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useAddWaterReading() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: { batch_id: string; temperature?: number; ph?: number; dissolved_oxygen?: number; ammonia?: number; nitrite?: number; salinity?: number; turbidity?: number }) => {
      const { error } = await supabase.from("water_readings").insert({
        batch_id: values.batch_id,
        temperature: values.temperature ?? null,
        ph: values.ph ?? null,
        dissolved_oxygen: values.dissolved_oxygen ?? null,
        ammonia: values.ammonia ?? null,
        nitrite: values.nitrite ?? null,
        salinity: values.salinity ?? null,
        turbidity: values.turbidity ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["water_readings"] });
      toast({ title: "Water reading saved!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useAddHealthRecord() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: { batch_id: string; title: string; record_type: string; severity: string; description?: string; treatment?: string; mortality_count?: number }) => {
      const { error } = await supabase.from("health_records").insert({
        batch_id: values.batch_id,
        title: values.title,
        record_type: values.record_type,
        severity: values.severity,
        description: values.description || null,
        treatment: values.treatment || null,
        mortality_count: values.mortality_count ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["health_records"] });
      toast({ title: "Health record added!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useAddFinancialRecord() {
  const qc = useQueryClient();
  const { data: farm } = useFarm();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: { record_type: string; category: string; amount: number; description?: string; batch_id?: string; transaction_date?: string }) => {
      if (!farm) throw new Error("Please complete farm setup first");
      const { error } = await supabase.from("financial_records").insert({
        farm_id: farm.id,
        record_type: values.record_type,
        category: values.category,
        amount: values.amount,
        description: values.description || null,
        batch_id: values.batch_id || null,
        transaction_date: values.transaction_date || new Date().toISOString().split("T")[0],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_records"] });
      toast({ title: "Transaction recorded!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
