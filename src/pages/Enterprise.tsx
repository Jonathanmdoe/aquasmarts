import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Building2, Plug, Palette, UserCog, Shield, Crown, Check, Copy, ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import UpgradeGate from "@/components/UpgradeGate";

export default function Enterprise() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tierName } = useFeatureAccess();

  const [brandName, setBrandName] = useState("AquaSmart");
  const [brandColor, setBrandColor] = useState("#0a6e9c");
  const [supportEmail, setSupportEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const apiKey = "ent_live_••••••••••••3a9f";

  const copy = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  const saveBranding = () => {
    toast({ title: "Branding saved", description: "Your white-label settings have been updated." });
  };

  const saveIntegration = () => {
    if (!webhookUrl.startsWith("http")) {
      toast({ title: "Invalid URL", description: "Webhook URL must start with http(s)://", variant: "destructive" });
      return;
    }
    toast({ title: "Integration saved", description: "Webhook endpoint registered." });
  };

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings")} className="w-8 h-8 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-primary-foreground" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display text-primary-foreground">Enterprise</h1>
              <Crown className="w-4 h-4 text-accent" />
            </div>
            <p className="text-xs text-primary-foreground/70 mt-0.5">Advanced controls & integrations</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-4">
        {/* Plan banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{tierName} plan</p>
            <p className="text-xs text-muted-foreground">Unlock white-label, custom integrations & SLA</p>
          </div>
          <button onClick={() => navigate("/subscription")}
            className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
            Manage
          </button>
        </motion.div>

        <UpgradeGate feature="white_label" fallbackMessage="White-label branding requires the Enterprise plan.">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" /> White-Label Branding
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Brand name</label>
                <input value={brandName} onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Primary color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)}
                    className="w-12 h-10 rounded-xl border border-border bg-transparent cursor-pointer" />
                  <input value={brandColor} onChange={(e) => setBrandColor(e.target.value)}
                    className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Support email</label>
                <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@yourcompany.com"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <button onClick={saveBranding}
                className="w-full gradient-ocean text-primary-foreground font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Save Branding
              </button>
            </div>
          </motion.div>
        </UpgradeGate>

        <UpgradeGate feature="custom_integrations" fallbackMessage="Custom integrations & API access require the Enterprise plan.">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Plug className="w-4 h-4 text-primary" /> Custom Integrations
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">API Key</label>
                <div className="flex gap-2">
                  <input readOnly value={apiKey}
                    className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-mono outline-none" />
                  <button onClick={() => copy(apiKey, "API key")}
                    className="px-3 rounded-xl bg-primary/10 text-primary">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Webhook endpoint</label>
                <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.yourcompany.com/webhooks/aquasmart"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <button onClick={saveIntegration}
                className="w-full gradient-ocean text-primary-foreground font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Register Webhook
              </button>
              <a href="https://docs.lovable.dev" target="_blank" rel="noreferrer"
                className="w-full bg-muted/50 text-foreground font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" /> View API Docs
              </a>
            </div>
          </motion.div>
        </UpgradeGate>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-primary" /> Dedicated Support
          </h3>
          <div className="space-y-2">
            {[
              { icon: Shield, label: "SLA Guarantee", desc: "99.9% uptime commitment" },
              { icon: UserCog, label: "Account Manager", desc: "Dedicated contact for your team" },
              { icon: Building2, label: "Onboarding", desc: "Custom training sessions" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Check className="w-4 h-4 text-success" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
