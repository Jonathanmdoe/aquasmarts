import { useEffect, useState } from "react";
import { Smartphone, Loader2, CheckCircle2, Copy, Clock, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [accountName, setAccountName] = useState("AquaSmart");
  const [autoApproved, setAutoApproved] = useState(false);

  useEffect(() => {
    if (!open) {
      setSubmitted(false);
      setSubmitting(false);
      setCode("");
      setReference(null);
      setAutoApproved(false);
      return;
    }
    supabase.functions
      .invoke("manual-payment", { body: { action: "config" } })
      .then(({ data }) => {
        setMpesaNumber(data?.mpesa_number || "");
        setAccountName(data?.mpesa_account_name || "AquaSmart");
      })
      .catch(() => undefined);
  }, [open]);

  const copyNumber = async () => {
    if (!mpesaNumber) return;
    await navigator.clipboard.writeText(mpesaNumber);
    toast({ title: "Copied", description: `Lipa Namba ${mpesaNumber} copied.` });
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manual-payment", {
        body: {
          action: "submit",
          purpose,
          plan,
          phone,
          code,
          delivery_type: deliveryType,
          delivery_address: deliveryAddress,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReference(data.reference);
      setAutoApproved(data.status === "paid");
      setSubmitted(true);
      onPaid?.();
    } catch (e) {
      toast({
        title: "Could not submit payment",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Pay {formatTzs(amountTzs)} with M-Pesa (Vodacom). Lipa kwa M-Pesa.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            {autoApproved ? (
              <CheckCircle2 className="w-12 h-12 text-secondary" />
            ) : (
              <Clock className="w-12 h-12 text-primary" />
            )}
            <p className="font-semibold text-foreground">
              {autoApproved ? "Payment received" : "Payment submitted for confirmation"}
            </p>
            <p className="text-sm text-muted-foreground">
              {autoApproved
                ? `Your payment of ${formatTzs(amountTzs)} is recorded and your ${purpose === "subscription" ? "plan is now active" : "order is confirmed"}.`
                : `We are verifying your M-Pesa payment of ${formatTzs(amountTzs)}. You will be notified once it is confirmed — usually within a few minutes.`}
            </p>
            <p className="text-xs text-muted-foreground">Ref: {reference}</p>
            <Button className="w-full mt-2" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : (
          <Tabs defaultValue="mpesa">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
              <TabsTrigger value="azampay">AzamPay</TabsTrigger>
            </TabsList>

            <TabsContent value="mpesa" className="space-y-4 pt-4">
              <div className="rounded-xl bg-muted p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">{formatTzs(amountTzs)}</span>
              </div>

              <div className="rounded-xl border border-border p-3 space-y-2 text-sm">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" /> How to pay
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[13px]">
                  <li>Dial *150*00# → Lipa kwa M-Pesa → Weka Namba ya Kampuni.</li>
                  <li>
                    Enter Lipa Namba:{" "}
                    <span className="font-bold text-foreground">{mpesaNumber || "not set yet"}</span> ({accountName})
                  </li>
                  <li>Enter amount <span className="font-bold text-foreground">{amountTzs.toLocaleString("en-TZ")}</span> and confirm with your PIN.</li>
                  <li>Copy the confirmation code from the M-Pesa SMS and paste it below.</li>
                </ol>
                {mpesaNumber && (
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={copyNumber}>
                    <Copy className="w-3.5 h-3.5" /> Copy Lipa Namba
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mm-phone">Phone number used to pay</Label>
                <Input
                  id="mm-phone"
                  inputMode="tel"
                  placeholder="0712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mm-code">M-Pesa confirmation code</Label>
                <Input
                  id="mm-code"
                  placeholder="e.g. QJ12AB34CD"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
              </div>

              <Button
                className="w-full gap-2"
                disabled={submitting || phone.replace(/\D/g, "").length < 9 || code.trim().length < 6}
                onClick={submit}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                Submit payment for confirmation
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                Send the money to the Lipa Namba above first — the confirmation code is your proof of payment.
              </p>
            </TabsContent>

            <TabsContent value="azampay" className="pt-4">
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Wallet className="w-10 h-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">AzamPay — coming soon</p>
                <p className="text-sm text-muted-foreground">
                  Automatic checkout with Tigo Pesa, Airtel Money, HaloPesa and cards will be available once our
                  AzamPay account is live. For now please use M-Pesa.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
