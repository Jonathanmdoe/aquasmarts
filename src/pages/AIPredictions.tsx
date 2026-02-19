import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Sprout, Droplets, Utensils, DollarSign, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBatches, useFeedingLogs, useWaterReadings, useFinancialRecords } from "@/hooks/useFarm";

interface Predictions {
  harvest_prediction?: { ready: boolean; estimated_days: number; confidence: string; reasoning: string };
  feeding_recommendation?: { adjust: string; amount_change_pct: number; reasoning: string };
  water_quality_alert?: { status: string; concerns: string[]; actions: string[] };
  growth_forecast?: { current_trend: string; projected_biomass_30d: number; reasoning: string };
  cost_optimization?: { tip: string; potential_saving_pct: number };
  raw?: string;
}

export default function AIPredictions() {
  const { data: batches } = useBatches();
  const { data: feedingLogs } = useFeedingLogs();
  const { data: waterReadings } = useWaterReadings();
  const { data: financials } = useFinancialRecords();
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPredictions = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-predictions", {
        body: {
          batches: (batches ?? []).slice(0, 10).map(b => ({ name: b.name, species: b.species, status: b.status, current_count: b.current_count, avg_weight: b.avg_weight, biomass: b.biomass, fcr: b.fcr, mortality_rate: b.mortality_rate, stage: b.stage, pond: b.pond })),
          waterReadings: (waterReadings ?? []).slice(0, 10).map(r => ({ temperature: r.temperature, ph: r.ph, dissolved_oxygen: r.dissolved_oxygen, ammonia: r.ammonia, nitrite: r.nitrite })),
          feedingLogs: (feedingLogs ?? []).slice(0, 10).map(l => ({ feed_type: l.feed_type, amount_kg: l.amount_kg, status: l.status })),
          financials: { total_records: financials?.length ?? 0, total_revenue: financials?.filter(f => f.record_type === "revenue").reduce((s, f) => s + f.amount, 0) ?? 0, total_expense: financials?.filter(f => f.record_type === "expense").reduce((s, f) => s + f.amount, 0) ?? 0 },
        },
      });
      if (fnError) throw fnError;
      setPredictions(data.predictions);
    } catch (e: any) {
      setError(e.message || "Failed to get predictions");
    } finally {
      setLoading(false);
    }
  };

  const cards = predictions ? [
    predictions.harvest_prediction && {
      icon: Sprout, title: "Harvest Prediction", color: "bg-success-light text-success",
      content: predictions.harvest_prediction.ready
        ? `Ready for harvest! (${predictions.harvest_prediction.confidence} confidence)`
        : `Est. ${predictions.harvest_prediction.estimated_days} days remaining`,
      detail: predictions.harvest_prediction.reasoning,
    },
    predictions.feeding_recommendation && {
      icon: Utensils, title: "Feeding Advice", color: "bg-amber-light text-amber",
      content: `${predictions.feeding_recommendation.adjust} (${predictions.feeding_recommendation.amount_change_pct > 0 ? "+" : ""}${predictions.feeding_recommendation.amount_change_pct}%)`,
      detail: predictions.feeding_recommendation.reasoning,
    },
    predictions.water_quality_alert && {
      icon: Droplets, title: "Water Quality", color: predictions.water_quality_alert.status === "good" ? "bg-success-light text-success" : "bg-danger-light text-danger",
      content: `Status: ${predictions.water_quality_alert.status}`,
      detail: [...(predictions.water_quality_alert.concerns ?? []), ...(predictions.water_quality_alert.actions ?? [])].join(". "),
    },
    predictions.growth_forecast && {
      icon: Brain, title: "Growth Forecast", color: "bg-ocean-surface text-primary",
      content: `Trend: ${predictions.growth_forecast.current_trend}`,
      detail: predictions.growth_forecast.reasoning,
    },
    predictions.cost_optimization && {
      icon: DollarSign, title: "Cost Optimization", color: "bg-teal-light text-teal",
      content: `Save up to ${predictions.cost_optimization.potential_saving_pct}%`,
      detail: predictions.cost_optimization.tip,
    },
  ].filter(Boolean) : [];

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">AI Predictions</h1>
            <p className="text-xs text-primary-foreground/70 mt-1">Smart farm intelligence</p>
          </div>
          <button onClick={fetchPredictions} disabled={loading}
            className="w-10 h-10 rounded-xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center disabled:opacity-50">
            <RefreshCw className={`w-5 h-5 text-primary-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-3 pb-4">
        {!predictions && !loading && !error && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-card p-6 text-center">
            <Brain className="w-12 h-12 text-primary mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-semibold text-foreground mb-1">Get AI-Powered Insights</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Analyze your farm data for harvest timing, feeding recommendations, and cost optimization.
            </p>
            <button onClick={fetchPredictions}
              className="gradient-ocean text-primary-foreground font-semibold py-2.5 px-6 rounded-xl text-sm">
              Generate Predictions
            </button>
          </motion.div>
        )}

        {loading && (
          <div className="bg-card rounded-2xl shadow-card p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Analyzing your farm data...</p>
          </div>
        )}

        {error && (
          <div className="bg-danger-light border border-danger/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Error</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {predictions?.raw && (
          <div className="bg-card rounded-2xl shadow-card p-4">
            <p className="text-sm text-foreground whitespace-pre-wrap">{predictions.raw}</p>
          </div>
        )}

        {cards.map((card: any, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl shadow-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                <p className="text-xs text-primary font-medium">{card.content}</p>
              </div>
            </div>
            {card.detail && <p className="text-xs text-muted-foreground leading-relaxed mt-1">{card.detail}</p>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
