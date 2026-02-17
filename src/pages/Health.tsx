import { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart, Plus, AlertTriangle, Skull, ShieldCheck, Pill,
  ChevronRight, Search, CheckCircle2, XCircle
} from "lucide-react";
import StatCard from "@/components/StatCard";

const healthRecords = [
  { id: "1", batch: "B001", type: "observation", title: "Skin lesions spotted", severity: "high", mortality: 12, date: "Today", treatment: "Potassium permanganate bath" },
  { id: "2", batch: "B002", type: "treatment", title: "Antiparasitic treatment", severity: "medium", mortality: 0, date: "Yesterday", treatment: "Praziquantel 5mg/L" },
  { id: "3", batch: "B003", type: "observation", title: "Normal behavior", severity: "low", mortality: 0, date: "2 days ago", treatment: null },
  { id: "4", batch: "B001", type: "mortality", title: "Unexplained mortality spike", severity: "high", mortality: 45, date: "3 days ago", treatment: "Lab sample sent" },
  { id: "5", batch: "B004", type: "treatment", title: "Prophylactic salt bath", severity: "low", mortality: 0, date: "4 days ago", treatment: "NaCl 15 ppt dip" },
];

const biosecurityItems = [
  { item: "Footbath disinfection at entry", done: true },
  { item: "Equipment sanitized after use", done: true },
  { item: "Dead fish removed & recorded", done: true },
  { item: "Visitor log maintained", done: false },
  { item: "Feed storage sealed properly", done: true },
  { item: "Water source checked for contamination", done: false },
];

const severityColors: Record<string, string> = {
  low: "bg-success-light text-success",
  medium: "bg-amber-light text-amber",
  high: "bg-danger-light text-danger",
};

const typeIcons: Record<string, any> = {
  observation: AlertTriangle,
  treatment: Pill,
  mortality: Skull,
};

export default function Health() {
  const [activeTab, setActiveTab] = useState<"records" | "biosecurity">("records");
  const completedChecks = biosecurityItems.filter(b => b.done).length;

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Health & Mortality</h1>
            <p className="text-xs text-primary-foreground/70">Disease tracking & biosecurity</p>
          </div>
          <button className="w-10 h-10 rounded-xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={<Heart className="w-4 h-4" />} label="Survival" value="97.1%" color="success" />
          <StatCard icon={<Skull className="w-4 h-4" />} label="Losses (7d)" value="57" color="coral" />
          <StatCard icon={<ShieldCheck className="w-4 h-4" />} label="Biosecurity" value={`${Math.round((completedChecks / biosecurityItems.length) * 100)}%`} color="teal" />
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1">
          <button onClick={() => setActiveTab("records")}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition ${activeTab === "records" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            Health Records
          </button>
          <button onClick={() => setActiveTab("biosecurity")}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition ${activeTab === "biosecurity" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            Biosecurity
          </button>
        </div>

        {activeTab === "records" && (
          <div className="space-y-2">
            {healthRecords.map((rec, i) => {
              const Icon = typeIcons[rec.type] || AlertTriangle;
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl p-3 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${severityColors[rec.severity]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{rec.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${severityColors[rec.severity]}`}>{rec.severity}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{rec.batch}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{rec.date}</span>
                        {rec.mortality > 0 && (
                          <>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-danger font-medium">{rec.mortality} dead</span>
                          </>
                        )}
                      </div>
                      {rec.treatment && (
                        <p className="text-[11px] text-primary mt-1">💊 {rec.treatment}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {activeTab === "biosecurity" && (
          <div className="space-y-2">
            <div className="bg-card rounded-2xl shadow-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Daily Checklist</h3>
              <div className="space-y-3">
                {biosecurityItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    {item.done ? (
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`text-sm ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.item}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Completion</span>
                  <span className="text-sm font-semibold text-foreground">{completedChecks}/{biosecurityItems.length}</span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${(completedChecks / biosecurityItems.length) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
