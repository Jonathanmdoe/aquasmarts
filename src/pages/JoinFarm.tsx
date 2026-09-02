import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function JoinFarm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [code, setCode] = useState((params.get("code") ?? "").toUpperCase());
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState<{ farm_name: string; role: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem("aquasmart.pendingInvite", code);
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, code, navigate]);

  const redeem = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("redeem-invitation", {
      body: { code: code.trim().toUpperCase() },
    });
    const err = (data as any)?.error ?? error?.message;
    if (err) {
      toast({ title: "Could not join farm", description: err, variant: "destructive" });
    } else {
      sessionStorage.removeItem("aquasmart.pendingInvite");
      sessionStorage.removeItem(`aquasmart.roles.${user?.id}`);
      setJoined({ farm_name: (data as any).farm_name, role: (data as any).role });
    }
    setSubmitting(false);
  };

  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl shadow-card p-6 w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Welcome to {joined.farm_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">You joined as {joined.role}.</p>
          <button
            onClick={() => window.location.assign("/")}
            className="w-full gradient-ocean text-primary-foreground font-semibold py-2.5 rounded-xl text-sm mt-5"
          >
            Go to my dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl shadow-card p-6 w-full max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-lg font-semibold text-foreground text-center">Join a farm team</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Enter the invitation code your farm owner shared with you.
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABCD1234"
          maxLength={12}
          className="w-full mt-5 bg-muted/50 border border-border rounded-xl px-4 py-3 text-center tracking-[0.3em] font-semibold outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={redeem}
          disabled={submitting || !code.trim()}
          className="w-full gradient-ocean text-primary-foreground font-semibold py-2.5 rounded-xl text-sm mt-4 disabled:opacity-50"
        >
          {submitting ? "Joining..." : "Join farm"}
        </button>
      </motion.div>
    </div>
  );
}
