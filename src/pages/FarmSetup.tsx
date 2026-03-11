import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Fish, Waves, ShoppingCart, ChevronRight, ChevronLeft, MapPin, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const operationTypes = [
  { value: "hatchery", label: "Hatchery", desc: "Breeding & fingerling production", icon: "🐟" },
  { value: "grow_out", label: "Grow-out", desc: "Raising fish to market size", icon: "🎣" },
  { value: "processing", label: "Processing", desc: "Post-harvest processing", icon: "🏭" },
  { value: "integrated", label: "Integrated", desc: "Full cycle operation", icon: "🔄" },
];

const productionSystems = [
  { value: "ponds", label: "Earthen Ponds", desc: "Traditional pond culture", icon: "🌊" },
  { value: "ras", label: "RAS", desc: "Recirculating aquaculture", icon: "♻️" },
  { value: "cages", label: "Cages/Pens", desc: "Open water cage farming", icon: "🏗️" },
  { value: "raceways", label: "Raceways", desc: "Flow-through channels", icon: "💧" },
];

const marketOrientations = [
  { value: "table_fish", label: "Table Fish", desc: "Live/fresh fish for markets", icon: "🍽️" },
  { value: "fingerlings", label: "Fingerling Sales", desc: "Selling juvenile fish", icon: "🐠" },
  { value: "export", label: "Export", desc: "International markets", icon: "✈️" },
  { value: "mixed", label: "Mixed", desc: "Multiple market channels", icon: "📊" },
];

export default function FarmSetup() {
  const [step, setStep] = useState(0);
  const [farmName, setFarmName] = useState("");
  const [location, setLocation] = useState("");
  const [numPonds, setNumPonds] = useState(1);
  const [operationType, setOperationType] = useState("");
  const [productionSystem, setProductionSystem] = useState("");
  const [marketOrientation, setMarketOrientation] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const steps = [
    { title: "Farm Details", subtitle: "Tell us about your farm" },
    { title: "Operation Type", subtitle: "What kind of operation?" },
    { title: "Production System", subtitle: "How do you farm?" },
    { title: "Market", subtitle: "Who are your buyers?" },
  ];

  const canProceed = () => {
    if (step === 0) return farmName.trim().length > 0;
    if (step === 1) return operationType !== "";
    if (step === 2) return productionSystem !== "";
    if (step === 3) return marketOrientation !== "";
    return false;
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("farms").insert({
        user_id: user.id,
        name: farmName.trim(),
        location: location.trim() || null,
        num_ponds: numPonds,
        operation_type: operationType,
        production_system: productionSystem,
        market_orientation: marketOrientation,
        onboarding_complete: true,
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Farm created!", description: "Welcome to AquaSmart 🐟" });
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const OptionCard = ({ item, selected, onSelect }: { item: any; selected: boolean; onSelect: () => void }) => (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-2xl border transition-all ${
        selected
          ? "border-primary bg-ocean-surface shadow-card"
          : "border-border bg-card hover:border-primary/30"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{item.icon}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{item.label}</p>
          <p className="text-xs text-muted-foreground">{item.desc}</p>
        </div>
        {selected && <Check className="w-5 h-5 text-primary" />}
      </div>
    </motion.button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="gradient-ocean px-4 pt-10 pb-8">
        <h1 className="text-xl font-bold font-display text-primary-foreground">{steps[step].title}</h1>
        <p className="text-xs text-primary-foreground/70 mt-1">{steps[step].subtitle}</p>
        <div className="flex gap-2 mt-4">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary-foreground" : "bg-primary-foreground/20"}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 -mt-4 relative z-10 pb-24">
        <div className="space-y-3">
            {step === 0 && (
              <div className="bg-card rounded-2xl shadow-card p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Farm Name *</label>
                  <div className="relative">
                    <Fish className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder="e.g. Sunrise Aqua Farm"
                      className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Region"
                      className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Number of Ponds / Units</label>
                  <div className="relative">
                    <Waves className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="number" min={1} value={numPonds} onChange={(e) => setNumPonds(Number(e.target.value))}
                      className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                {operationTypes.map((item) => (
                  <OptionCard key={item.value} item={item} selected={operationType === item.value} onSelect={() => setOperationType(item.value)} />
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {productionSystems.map((item) => (
                  <OptionCard key={item.value} item={item} selected={productionSystem === item.value} onSelect={() => setProductionSystem(item.value)} />
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                {marketOrientations.map((item) => (
                  <OptionCard key={item.value} item={item} selected={marketOrientation === item.value} onSelect={() => setMarketOrientation(item.value)} />
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border/50 safe-bottom p-4 z-20">
        <div className="max-w-md mx-auto">
          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              onClick={step === 3 ? handleFinish : () => setStep(step + 1)}
              disabled={!canProceed() || loading}
              className="flex-1 flex items-center justify-center gap-1 gradient-ocean text-primary-foreground font-semibold py-3 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? "Setting up..." : step === 3 ? "Create Farm" : "Continue"}
              {step < 3 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
          {!canProceed() && (
            <p className="text-xs text-destructive text-center mt-2">
              {step === 0 ? "Please enter a farm name to continue" : "Please select an option to continue"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
