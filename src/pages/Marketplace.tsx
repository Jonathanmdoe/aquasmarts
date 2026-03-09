import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Star, MapPin, Fish, ChevronRight, Search, Filter, TrendingUp, Plus } from "lucide-react";
import { formatTZS } from "@/lib/currency";
import UpgradeGate from "@/components/UpgradeGate";
import AddListingForm from "@/components/forms/AddListingForm";

const listings = [
  {
    id: "L1",
    title: "Tilapia Fingerlings",
    seller: "Sunrise Hatchery",
    location: "Lagos, Nigeria",
    price: 0.15,
    unit: "per piece",
    quantity: "50,000 available",
    species: "Nile Tilapia",
    weight: "5-8g",
    rating: 4.8,
    reviews: 42,
    survivalGuarantee: 90,
    verified: true,
    category: "fingerlings",
  },
  {
    id: "L2",
    title: "Table-Size Catfish",
    seller: "Delta AquaFarm",
    location: "Asaba, Nigeria",
    price: 3.50,
    unit: "per kg",
    quantity: "2,500 kg",
    species: "African Catfish",
    weight: "800g-1.2kg",
    rating: 4.5,
    reviews: 28,
    survivalGuarantee: 0,
    verified: true,
    category: "table-fish",
  },
  {
    id: "L3",
    title: "Premium Smoked Tilapia",
    seller: "AquaProcess Co.",
    location: "Accra, Ghana",
    price: 8.00,
    unit: "per kg",
    quantity: "500 kg",
    species: "Tilapia",
    weight: "Processed",
    rating: 4.9,
    reviews: 67,
    survivalGuarantee: 0,
    verified: true,
    category: "processed",
  },
  {
    id: "L4",
    title: "Carp Broodstock",
    seller: "Golden Carp Farm",
    location: "Hanoi, Vietnam",
    price: 25.00,
    unit: "per piece",
    quantity: "20 pairs",
    species: "Common Carp",
    weight: "2-3kg",
    rating: 4.6,
    reviews: 12,
    survivalGuarantee: 80,
    verified: false,
    category: "broodstock",
  },
];

const categories = ["All", "Fingerlings", "Table Fish", "Processed", "Broodstock", "Fry"];

export default function Marketplace() {
  const [showForm, setShowForm] = useState(false);

  return (
    <UpgradeGate feature="marketplace" fallbackMessage="Access the aquaculture marketplace to buy and sell fish, fingerlings, and supplies. Upgrade to Pro to unlock.">
    <div className="min-h-screen relative">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Marketplace</h1>
            <p className="text-xs text-primary-foreground/70">Aquaculture trade platform</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-xs font-medium bg-primary-foreground/15 backdrop-blur text-primary-foreground rounded-lg px-3 py-1.5">
              My Listings
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50" />
          <input
            placeholder="Search fish, fingerlings, feed..."
            className="w-full bg-primary-foreground/10 backdrop-blur text-primary-foreground placeholder:text-primary-foreground/40 rounded-xl pl-10 pr-10 py-2.5 text-sm border-0 outline-none"
          />
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50" />
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-3 pb-4">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map((c, i) => (
            <button
              key={c}
              className={`text-xs font-medium px-4 py-1.5 rounded-full whitespace-nowrap transition ${
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground shadow-card"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Market Insight */}
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

        {/* Listings */}
        {listings.map((listing, i) => (
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
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-foreground">{listing.title}</h3>
                    {listing.verified && (
                      <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center">
                        <span className="text-[8px] text-secondary-foreground">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{listing.seller}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {listing.location}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber" /> {listing.rating} ({listing.reviews})
              </span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-lg font-bold text-foreground">
                  {formatTZS(listing.price)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{listing.unit}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">{listing.quantity}</p>
              </div>
              <div className="flex items-center gap-2">
                {listing.survivalGuarantee > 0 && (
                  <span className="text-[10px] font-medium bg-success-light text-success px-2 py-0.5 rounded-full">
                    {listing.survivalGuarantee}% survival
                  </span>
                )}
                <button className="text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg">
                  Contact
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
    </UpgradeGate>
  );
}
