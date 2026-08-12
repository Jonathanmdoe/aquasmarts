import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentResult({ outcome }: { outcome: "success" | "canceled" }) {
  const [params] = useSearchParams();
  const reference = params.get("ref");
  const [status, setStatus] = useState<"checking" | "paid" | "pending" | "failed">(
    outcome === "success" ? "checking" : "failed",
  );

  useEffect(() => {
    if (outcome !== "success" || !reference) return;
    let tries = 0;
    const check = async () => {
      tries += 1;
      const { data } = await supabase.functions.invoke("manual-payment", { body: { action: "status", reference } });
      if (data?.status === "paid") setStatus("paid");
      else if (data?.status === "failed") setStatus("failed");
      else if (tries >= 6) setStatus("pending");
      else setTimeout(check, 4000);
    };
    check();
  }, [outcome, reference]);

  const copy = {
    checking: { icon: <Loader2 className="w-12 h-12 text-primary animate-spin" />, title: "Confirming your payment…", body: "This usually takes a few seconds." },
    paid: { icon: <CheckCircle2 className="w-12 h-12 text-secondary" />, title: "Payment received", body: "Your purchase is confirmed. Thank you!" },
    pending: { icon: <Loader2 className="w-12 h-12 text-primary animate-spin" />, title: "Still processing", body: "We'll update your account as soon as the payment clears." },
    failed: { icon: <XCircle className="w-12 h-12 text-destructive" />, title: "Payment not completed", body: "No money was taken. You can try again any time." },
  }[status];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      {copy.icon}
      <h1 className="text-xl font-bold text-foreground">{copy.title}</h1>
      <p className="text-sm text-muted-foreground max-w-xs">{copy.body}</p>
      {reference && <p className="text-xs text-muted-foreground">Ref: {reference}</p>}
      <Button asChild className="mt-2">
        <Link to="/">Back to app</Link>
      </Button>
    </main>
  );
}
