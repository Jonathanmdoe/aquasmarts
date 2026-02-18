import { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart, Plus, AlertTriangle, Skull, ShieldCheck, Pill,
  ChevronRight, CheckCircle2, XCircle
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { useHealthRecords, useBiosecurityChecks, useBatches } from "@/hooks/useFarm";
import { supabase } from "@/integrations/supabase/client";

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
  const { data: records, isLoading: recordsLoading } = useHealthRecords();
  const { data: checks, isLoading: checksLoading, refetch: refetchChecks } = useBiosecurityChecks();
  const { data: batches } = useBatches();

  const totalMortality = records?.reduce((s, r) => s + (r.mortality_count ?? 0), 0) ?? 0;
  const completedChecks = checks?.filter(c => c.is_completed).length ?? 0;
  const totalChecks = checks?.length ?? 0;

  const toggleCheck = async (id: string, current: boolean) => {
    await supabase.from("biosecurity_checks").update({
      is_completed: !current,
      completed_at: !current ? new Date().toISOString() : null,
    }).eq("id", id);
    refetchChecks();
  };

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
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={<Heart className="w-4 h-4" />} label="Records" value={`${records?.length ?? 0}`} color="success" />
          <StatCard icon={<Skull className="w-4 h-4" />} label="Losses" value={`${totalMortality}`} color="coral" />
          <StatCard icon={<ShieldCheck className="w-4 h-4" />} label="Biosecurity" value={totalChecks > 0 ? `${Math.round((completedChecks / totalChecks) * 100)}%` : "—"} color="teal" />
        </div>

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
          recordsLoading ? (
            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : (records?.length ?? 0) === 0 ? (
            <div className="bg-card rounded-xl p-6 shadow-card text-center">
              <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No health records yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records?.map((rec, i) => {
                const Icon = typeIcons[rec.record_type] || AlertTriangle;
                const batch = batches?.find(b => b.id === rec.batch_id);
                return (
                  <motion.div key={rec.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-xl p-3 shadow-card">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${severityColors[rec.severity ?? "low"]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{rec.title}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${severityColors[rec.severity ?? "low"]}`}>{rec.severity}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{batch?.name ?? "Batch"}</span>
                          {(rec.mortality_count ?? 0) > 0 && (
                            <><span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-danger font-medium">{rec.mortality_count} dead</span></>
                          )}
                        </div>
                        {rec.treatment && <p className="text-[11px] text-primary mt-1">💊 {rec.treatment}</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        )}

        {activeTab === "biosecurity" && (
          checksLoading ? (
            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : (checks?.length ?? 0) === 0 ? (
            <div className="bg-card rounded-xl p-6 shadow-card text-center">
              <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No biosecurity items yet.</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl shadow-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Daily Checklist</h3>
              <div className="space-y-3">
                {checks?.map((item, i) => (
                  <motion.button key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => toggleCheck(item.id, item.is_completed)}
                    className="flex items-center gap-3 w-full text-left">
                    {item.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`text-sm ${item.is_completed ? "text-foreground" : "text-muted-foreground"}`}>{item.item}</span>
                  </motion.button>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Completion</span>
                  <span className="text-sm font-semibold text-foreground">{completedChecks}/{totalChecks}</span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${totalChecks > 0 ? (completedChecks / totalChecks) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
