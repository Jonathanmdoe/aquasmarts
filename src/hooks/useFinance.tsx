import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "./useFarm";
import { useToast } from "./use-toast";

export function useInvoices() {
  const { data: farm } = useFarm();
  return useQuery({
    queryKey: ["invoices", farm?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices").select("*").eq("farm_id", farm!.id)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!farm?.id,
  });
}

export function useLoans() {
  const { data: farm } = useFarm();
  return useQuery({
    queryKey: ["loans", farm?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans").select("*").eq("farm_id", farm!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!farm?.id,
  });
}

export function useAddInvoice() {
  const qc = useQueryClient();
  const { data: farm } = useFarm();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (v: { buyer_name: string; item: string; amount: number; due_date: string; batch_id?: string; status?: string }) => {
      if (!farm) throw new Error("No farm");
      const { error } = await supabase.from("invoices").insert({
        farm_id: farm.id,
        buyer_name: v.buyer_name, item: v.item, amount: v.amount,
        due_date: v.due_date, batch_id: v.batch_id || null,
        status: v.status || "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast({ title: "Invoice created" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (v: { id: string; status: string }) => {
      const patch: any = { status: v.status };
      if (v.status === "paid") patch.paid_date = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("invoices").update(patch).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast({ title: "Invoice updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useAddLoan() {
  const qc = useQueryClient();
  const { data: farm } = useFarm();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (v: { lender: string; purpose?: string; principal: number; interest_rate: number; monthly_installment: number; term_months: number }) => {
      if (!farm) throw new Error("No farm");
      const { error } = await supabase.from("loans").insert({
        farm_id: farm.id, lender: v.lender, purpose: v.purpose || null,
        principal: v.principal, interest_rate: v.interest_rate,
        monthly_installment: v.monthly_installment, term_months: v.term_months,
        remaining_balance: v.principal,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["loans"] }); toast({ title: "Loan added" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useRecordLoanPayment() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (v: { loan_id: string; amount: number; new_balance: number }) => {
      const { error: pe } = await supabase.from("loan_payments").insert({ loan_id: v.loan_id, amount: v.amount });
      if (pe) throw pe;
      const patch: any = { remaining_balance: Math.max(0, v.new_balance) };
      if (v.new_balance <= 0) patch.status = "completed";
      const { error } = await supabase.from("loans").update(patch).eq("id", v.loan_id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["loans"] }); toast({ title: "Payment recorded" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
