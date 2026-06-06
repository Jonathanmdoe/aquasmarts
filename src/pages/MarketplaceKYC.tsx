import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, ShieldCheck, FileText, Building2, User, Banknote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(20),
  business_name: z.string().trim().max(120).optional(),
  business_type: z.string().min(1),
  address: z.string().trim().min(4).max(200),
  country: z.string().trim().min(2).max(60),
  id_doc_type: z.string().min(1),
  id_doc_number: z.string().trim().min(3).max(60),
  bank_name: z.string().trim().min(2).max(80),
  bank_account_number: z.string().trim().min(4).max(40),
  bank_account_name: z.string().trim().min(2).max(80),
});
type V = z.infer<typeof schema>;

const STEPS = [
  { label: "Personal", icon: User },
  { label: "Business", icon: Building2 },
  { label: "ID", icon: FileText },
  { label: "Bank", icon: Banknote },
  { label: "Review", icon: ShieldCheck },
];

export default function MarketplaceKYC() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["seller_kyc", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("seller_kyc" as any).select("*").eq("user_id", user!.id).maybeSingle();
      return data as any;
    },
    enabled: !!user,
  });

  const form = useForm<V>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: existing?.full_name || "",
      phone: existing?.phone || "",
      business_name: existing?.business_name || "",
      business_type: existing?.business_type || "",
      address: existing?.address || "",
      country: existing?.country || "Tanzania",
      id_doc_type: existing?.id_doc_type || "",
      id_doc_number: existing?.id_doc_number || "",
      bank_name: existing?.bank_name || "",
      bank_account_number: existing?.bank_account_number || "",
      bank_account_name: existing?.bank_account_name || "",
    },
    values: existing ? {
      full_name: existing.full_name || "",
      phone: existing.phone || "",
      business_name: existing.business_name || "",
      business_type: existing.business_type || "",
      address: existing.address || "",
      country: existing.country || "Tanzania",
      id_doc_type: existing.id_doc_type || "",
      id_doc_number: existing.id_doc_number || "",
      bank_name: existing.bank_name || "",
      bank_account_number: existing.bank_account_number || "",
      bank_account_name: existing.bank_account_name || "",
    } : undefined,
  });

  const submit = async (v: V) => {
    const payload = { ...v, user_id: user!.id, status: "pending", submitted_at: new Date().toISOString() };
    const { error } = await supabase.from("seller_kyc" as any).upsert(payload, { onConflict: "user_id" });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["seller_kyc"] });
    setDone(true);
  };

  const next = async () => {
    const fields: (keyof V)[][] = [
      ["full_name", "phone"],
      ["business_name", "business_type", "address", "country"],
      ["id_doc_type", "id_doc_number"],
      ["bank_name", "bank_account_number", "bank_account_name"],
    ];
    const valid = await form.trigger(fields[step] || []);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-3xl p-6 shadow-card text-center max-w-sm space-y-3">
          <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-lg font-bold">Submitted for review</h2>
          <p className="text-xs text-muted-foreground">Once approved, you unlock:</p>
          <ul className="text-xs text-left space-y-1.5">
            <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Verified seller badge</li>
            <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Higher trust ranking</li>
            <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Faster payouts</li>
            <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Cross-border orders</li>
          </ul>
          <button onClick={() => navigate("/marketplace")} className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold">Back to Marketplace</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-10 pb-5">
        <button onClick={() => navigate(-1)} className="text-primary-foreground/80 mb-2 flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
        <h1 className="text-xl font-bold font-display text-primary-foreground">Seller Verification</h1>
        <p className="text-xs text-primary-foreground/70">5-step KYC to unlock trusted-seller benefits</p>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const cur = i === step;
              return (
                <div key={s.label} className="flex-1 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    done ? "bg-success text-success-foreground" : cur ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <p className="text-[9px] mt-1 text-center text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>

          <div className="h-1 bg-muted rounded-full overflow-hidden mb-4">
            <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>

          <form onSubmit={form.handleSubmit(submit)} className="space-y-3">
            {step === 0 && (
              <>
                <Field label="Full Legal Name" {...form.register("full_name")} error={form.formState.errors.full_name?.message} />
                <Field label="Phone Number" {...form.register("phone")} error={form.formState.errors.phone?.message} />
              </>
            )}
            {step === 1 && (
              <>
                <Field label="Business / Farm Name" {...form.register("business_name")} />
                <Select label="Business Type" {...form.register("business_type")} options={["sole-proprietor", "company", "cooperative", "ngo"]} error={form.formState.errors.business_type?.message} />
                <Field label="Address" {...form.register("address")} error={form.formState.errors.address?.message} />
                <Field label="Country" {...form.register("country")} error={form.formState.errors.country?.message} />
              </>
            )}
            {step === 2 && (
              <>
                <Select label="ID Document Type" {...form.register("id_doc_type")} options={["national-id", "passport", "drivers-license", "voter-card"]} error={form.formState.errors.id_doc_type?.message} />
                <Field label="Document Number" {...form.register("id_doc_number")} error={form.formState.errors.id_doc_number?.message} />
                <p className="text-[11px] text-muted-foreground bg-muted rounded-lg p-2">Upload of physical document will be requested via email after submission.</p>
              </>
            )}
            {step === 3 && (
              <>
                <Field label="Bank Name" {...form.register("bank_name")} error={form.formState.errors.bank_name?.message} />
                <Field label="Account Number" {...form.register("bank_account_number")} error={form.formState.errors.bank_account_number?.message} />
                <Field label="Account Holder Name" {...form.register("bank_account_name")} error={form.formState.errors.bank_account_name?.message} />
              </>
            )}
            {step === 4 && (
              <div className="space-y-2 text-xs">
                <p className="font-semibold">Review your information</p>
                {Object.entries(form.getValues()).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border py-1">
                    <span className="text-muted-foreground capitalize">{k.replaceAll("_", " ")}</span>
                    <span className="font-medium truncate ml-2 max-w-[60%] text-right">{v || "—"}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {step > 0 && (
                <button type="button" onClick={() => setStep((s) => s - 1)} className="flex-1 bg-muted text-foreground rounded-xl py-2.5 text-sm font-semibold">Back</button>
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold">Next</button>
              ) : (
                <button type="submit" className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold">Submit</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, ...props }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input {...props} className="w-full mt-1 rounded-xl bg-background border border-border px-3 py-2 text-sm" />
      {error && <p className="text-[10px] text-destructive mt-0.5">{error}</p>}
    </div>
  );
}

function Select({ label, error, options, ...props }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select {...props} className="w-full mt-1 rounded-xl bg-background border border-border px-3 py-2 text-sm">
        <option value="">Select…</option>
        {options.map((o: string) => <option key={o} value={o}>{o.replaceAll("-", " ")}</option>)}
      </select>
      {error && <p className="text-[10px] text-destructive mt-0.5">{error}</p>}
    </div>
  );
}
