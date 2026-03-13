import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Bell, Droplets, Heart, Fish, DollarSign,
  Mail, BellRing, Smartphone
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface NotifSetting {
  id: string;
  label: string;
  desc: string;
  icon: typeof Bell;
  enabled: boolean;
}

export default function Notifications() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [inApp, setInApp] = useState<NotifSetting[]>([
    { id: "water", label: "Water Quality Alerts", desc: "pH, oxygen, temperature warnings", icon: Droplets, enabled: true },
    { id: "health", label: "Health Alerts", desc: "Disease, mortality notifications", icon: Heart, enabled: true },
    { id: "feeding", label: "Feeding Reminders", desc: "Scheduled feeding notifications", icon: Fish, enabled: true },
    { id: "financial", label: "Financial Updates", desc: "Expense & revenue summaries", icon: DollarSign, enabled: false },
  ]);

  const [channels, setChannels] = useState([
    { id: "email", label: "Email Notifications", desc: "Receive alerts via email", icon: Mail, enabled: false },
    { id: "push", label: "Push Notifications", desc: "Browser push for critical alerts", icon: BellRing, enabled: false },
    { id: "sms", label: "SMS Notifications", desc: "Text messages for emergencies", icon: Smartphone, enabled: false },
  ]);

  const toggleInApp = (id: string) => {
    setInApp(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    toast({ title: "Preference updated", description: "Your notification settings have been saved." });
  };

  const toggleChannel = (id: string) => {
    const channel = channels.find(c => c.id === id);
    if (id === "email" || id === "push" || id === "sms") {
      if (!channel?.enabled) {
        toast({ title: "Coming Soon", description: `${channel?.label} will be available in a future update.` });
        return;
      }
    }
    setChannels(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button onClick={onToggle}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${enabled ? "bg-primary" : "bg-muted"}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings")} className="w-8 h-8 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-primary-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Notifications</h1>
            <p className="text-xs text-primary-foreground/70 mt-0.5">Manage your alert preferences</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-4">
        {/* In-App Alerts */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> In-App Alerts
          </h3>
          <div className="space-y-1">
            {inApp.map(setting => (
              <div key={setting.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                    <setting.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{setting.label}</p>
                    <p className="text-xs text-muted-foreground">{setting.desc}</p>
                  </div>
                </div>
                <Toggle enabled={setting.enabled} onToggle={() => toggleInApp(setting.id)} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Notification Channels */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-primary" /> Notification Channels
          </h3>
          <div className="space-y-1">
            {channels.map(channel => (
              <div key={channel.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                    <channel.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{channel.label}</p>
                    <p className="text-xs text-muted-foreground">{channel.desc}</p>
                  </div>
                </div>
                <Toggle enabled={channel.enabled} onToggle={() => toggleChannel(channel.id)} />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 px-1">
            Email, push, and SMS channels will be available in a future update. In-app alerts are active now.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
