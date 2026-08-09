import { useEffect, useRef, useState } from "react";
import { Smartphone, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "subscription" charges a plan, "marketplace" charges the current cart. */
  purpose: "subscription" | "marketplace";
  plan?: string;
  amountTzs: number;
  title: string;
  deliveryType?: string;
  deliveryAddress?: string | null;
  onPaid?: () => void;
}

const formatTzs = (n: number) => `TZS ${n.toLocaleString("en-TZ")}`;

export default function MobileMoneyDialog({
  open,
  onOpenChange,
  purpose,
  plan,
  amountTzs,
  title,
  deliveryType,
  deliveryAddress,
  onPaid,
}: Props) {
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "paid" | "failed">("idle");
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setReference(null);
      setStatus("idle");
      setSubmitting(false);
      if (pollRef.current) window.clearInterval(pollRef.current);
    }
  }, [open]);

  useEffect(() => {
    if (!reference || status !== "waiting") return;
    pollRef.current = window.setInterval(async () => {
      const { data } = await supabase.functions.invoke("selcom-status", { body: { reference } });
      if (data?.status === "paid") {
        setStatus("paid");
        if (pollRef.current) window.clearInterval(pollRef.current);
        onPaid?.();
      } else if (data?.status === "failed") {
        setStatus("failed");
        if (pollRef.current) window.clearInterval(pollRef.current);
      }
    }, 5000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [reference, status, onPaid]);

  const start = async (channel: "mobile_money" | "card") => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("selcom-checkout", {
        body: {
          purpose,
          plan,
          channel,
          phone,
          delivery_type: deliveryType,
          delivery_address: deliveryAddress,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setReference(data.reference);
      if (channel === "card" && data.payment_url) {
        window.open(data.payment_url, "_blank");
        setStatus("waiting");
      } else {
        setStatus("waiting");
        toast({ title: "Check your phone", description: data.message ?? "Enter your PIN to approve." });
      }
    } catch (e) {
      toast({
        title: "Payment failed to start",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Pay {formatTzs(amountTzs)} with M-Pesa, Tigo Pesa, Airtel Money, HaloPesa or a card.
          </DialogDescription>
        </DialogHeader>

        {status === "paid" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-secondary" />
            <p className="font-semibold text-foreground">Payment received</p>
            <p className="text-sm text-muted-foreground">{formatTzs(amountTzs)} confirmed.</p>
            <Button className="w-full mt-2" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : status === "waiting" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="font-medium text-foreground">Waiting for your approval…</p>
            <p className="text-sm text-muted-foreground">
              A payment request was sent to {phone || "your device"}. Enter your PIN to complete it.
            </p>
            <p className="text-xs text-muted-foreground">Ref: {reference}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-bold text-foreground">{formatTzs(amountTzs)}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mm-phone">Mobile money number</Label>
              <Input
                id="mm-phone"
                inputMode="tel"
                placeholder="0712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Button className="w-full gap-2" disabled={submitting || phone.replace(/\D/g, "").length < 9} onClick={() => start("mobile_money")}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              Pay with mobile money
            </Button>

            <Button variant="outline" className="w-full gap-2" disabled={submitting} onClick={() => start("card")}>
              <CreditCard className="w-4 h-4" />
              Pay with card instead
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
