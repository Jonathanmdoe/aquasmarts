import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShoppingCart, Star, MapPin, Fish, ChevronRight, Search, Filter, TrendingUp, Plus, Loader2, ClipboardList } from "lucide-react";
import { formatTZS } from "@/lib/currency";
import UpgradeGate from "@/components/UpgradeGate";
import AddListingForm from "@/components/forms/AddListingForm";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const categories = ["All", "Fingerlings", "Table Fish", "Processed", "Broodstock", "Fry", "Equipment", "Feed"];

function MarketplaceContent() {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["marketplace_listings"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("marketplace_listings" as any).select("*").eq("status", "active").order("created_at", { ascending: false }) as any);
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = listings.filter((l: any) => {
    const matchCategory = selectedCategory === "All" || l.category?.toLowerCase() === selectedCategory.toLowerCase().replace(" ", "-");
    const matchSearch = !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.species?.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen relative">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Marketplace</h1>
            <p className="text-xs text-primary-foreground/70">Aquaculture trade platform</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/my-listings")}
              className="text-xs font-medium bg-primary-foreground/15 text-primary-foreground rounded-lg px-3 py-1.5 flex items-center gap-1"
            >
              <ClipboardList className="w-3 h-3" /> My Listings
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs font-medium bg-accent text-accent-foreground rounded-lg px-3 py-1.5 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Sell
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50" />
          <input
            placeholder="Search fish, fingerlings, feed..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-primary-foreground/10 backdrop-blur text-primary-foreground placeholder:text-primary-foreground/40 rounded-xl pl-10 pr-10 py-2.5 text-sm border-0 outline-none"
          />
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50" />
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-3 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`text-xs font-medium px-4 py-1.5 rounded-full whitespace-nowrap transition ${
                selectedCategory === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground shadow-card"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-ocean-surface border border-primary/10 rounded-2xl p-3 flex items-start gap-3"
        >
          <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground">Market Trend</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Tilapia fingerling demand up 23% this month. Best time to list your fry batches.
            </p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <Fish className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No listings yet. Be the first to sell!</p>
          </div>
        ) : (
          filtered.map((listing: any, i: number) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-ocean-surface flex items-center justify-center">
                    <Fish className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{listing.title}</h3>
                    <p className="text-xs text-muted-foreground">{listing.species}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {listing.location}
                </span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {formatTZS(listing.price)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">{listing.unit}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">{listing.quantity} available</p>
                </div>
                <div className="flex items-center gap-2">
                  {listing.survival_guarantee > 0 && (
                    <span className="text-[10px] font-medium bg-success-light text-success px-2 py-0.5 rounded-full">
                      {listing.survival_guarantee}% survival
                    </span>
                  )}
                  <button className="text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg">
                    Contact
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      {showForm && <AddListingForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

export default function Marketplace() {
  return (
    <UpgradeGate feature="marketplace" fallbackMessage="Access the aquaculture marketplace to buy and sell fish, fingerlings, and supplies. Upgrade to Pro to unlock.">
      <MarketplaceContent />
    </UpgradeGate>
  );
}
