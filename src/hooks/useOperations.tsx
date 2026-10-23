import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { useToast } from "@/hooks/use-toast";

export function useInventoryItems() {
  const { data: farm } = useFarm();
  return useQuery({
    queryKey: ["inventory_items", farm?.id],
    enabled: !!farm?.id,
    queryFn: async () => {
      const { data, error } = await (supabase.from("inventory_items" as any)
        .select("*").eq("farm_id", farm!.id).order("name") as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useInventoryMovements() {
  const { data: farm } = useFarm();
  return useQuery({
    queryKey: ["inventory_movements", farm?.id],
    enabled: !!farm?.id,
    queryFn: async () => {
      const { data, error } = await (supabase.from("inventory_movements" as any)
        .select("*, inventory_items(name, unit)").eq("farm_id", farm!.id).order("occurred_at", { ascending: false }).limit(100) as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useFarmCustomers() {
  const { data: farm } = useFarm();
  return useQuery({
    queryKey: ["farm_customers", farm?.id],
    enabled: !!farm?.id,
    queryFn: async () => {
      const { data, error } = await (supabase.from("farm_customers" as any)
        .select("*").eq("farm_id", farm!.id).order("name") as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useFarmActivities() {
  const { data: farm } = useFarm();
  return useQuery({
    queryKey: ["farm_activities", farm?.id],
    enabled: !!farm?.id,
    queryFn: async () => {
      const { data, error } = await (supabase.from("farm_activities" as any)
        .select("*").eq("farm_id", farm!.id).order("activity_date", { ascending: false }).limit(200) as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

function useOperationMutation<T>(key: string, operation: (farmId: string, values: T) => Promise<void>, success: string) {
  const qc = useQueryClient();
  const { data: farm } = useFarm();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (values: T) => {
      if (!farm?.id) throw new Error("Farm not found");
      await operation(farm.id, values);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key] });
      toast({ title: success });
    },
    onError: (e: Error) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });
}

export function useSaveInventoryItem() {
  return useOperationMutation<any>("inventory_items", async (farmId, v) => {
    const payload = { name: v.name.trim(), category: v.category, unit: v.unit.trim(), low_stock_threshold: Number(v.low_stock_threshold || 0), unit_cost: Number(v.unit_cost || 0), supplier: v.supplier || null, notes: v.notes || null };
    const query = v.id
      ? (supabase.from("inventory_items" as any).update(payload).eq("id", v.id) as any)
      : (supabase.from("inventory_items" as any).insert({ ...payload, farm_id: farmId }) as any);
    const { error } = await query;
    if (error) throw error;
  }, "Inventory item saved");
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("inventory_items" as any).delete().eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory_items"] }); qc.invalidateQueries({ queryKey: ["inventory_movements"] }); toast({ title: "Inventory item removed" }); },
    onError: (e: Error) => toast({ title: "Could not delete", description: e.message, variant: "destructive" }),
  });
}

export function useRecordInventoryMovement() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (v: { farm_id: string; item_id: string; movement_type: "purchase" | "usage"; quantity: number; unit_cost?: number; reference?: string; notes?: string; recorded_by: string }) => {
      const quantity = Math.abs(Number(v.quantity));
      if (!quantity || quantity <= 0) throw new Error("Enter a quantity greater than zero");
      const { error } = await (supabase.from("inventory_movements" as any).insert({
        farm_id: v.farm_id, item_id: v.item_id, movement_type: v.movement_type,
        quantity_delta: v.movement_type === "usage" ? -quantity : quantity,
        unit_cost: v.movement_type === "purchase" ? Number(v.unit_cost || 0) : null,
        reference: v.reference || null, notes: v.notes || null, recorded_by: v.recorded_by,
      }) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_items"] });
      qc.invalidateQueries({ queryKey: ["inventory_movements"] });
      qc.invalidateQueries({ queryKey: ["financial_records"] });
      toast({ title: "Stock movement recorded" });
    },
    onError: (e: Error) => toast({ title: "Could not update stock", description: e.message, variant: "destructive" }),
  });
}

export function useSaveFarmCustomer() {
  return useOperationMutation<any>("farm_customers", async (farmId, v) => {
    const payload = { name: v.name.trim(), customer_type: v.customer_type, phone: v.phone.trim(), email: v.email || null, location: v.location || null, notes: v.notes || null };
    const query = v.id
      ? (supabase.from("farm_customers" as any).update(payload).eq("id", v.id) as any)
      : (supabase.from("farm_customers" as any).insert({ ...payload, farm_id: farmId }) as any);
    const { error } = await query;
    if (error) throw error;
  }, "Customer saved");
}

export function useDeleteFarmCustomer() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("farm_customers" as any).delete().eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["farm_customers"] }); toast({ title: "Customer removed" }); },
    onError: (e: Error) => toast({ title: "Could not delete", description: e.message, variant: "destructive" }),
  });
}

export function useAddFarmActivity() {
  return useOperationMutation<any>("farm_activities", async (farmId, v) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Login required");
    const { error } = await (supabase.from("farm_activities" as any).insert({
      farm_id: farmId, activity_date: v.activity_date, category: v.category,
      title: v.title.trim(), description: v.description || null, staff_name: v.staff_name || null, recorded_by: user.id,
    }) as any);
    if (error) throw error;
  }, "Activity recorded");
}

export function useDeleteFarmActivity() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("farm_activities" as any).delete().eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["farm_activities"] }); toast({ title: "Activity removed" }); },
    onError: (e: Error) => toast({ title: "Could not delete", description: e.message, variant: "destructive" }),
  });
}
