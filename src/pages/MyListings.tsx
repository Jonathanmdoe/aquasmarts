import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Fish, MapPin, Trash2, ToggleLeft, ToggleRight, Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatTZS } from "@/lib/currency";
import AddListingForm from "@/components/forms/AddListingForm";

export default function MyListings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["my_listings", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("marketplace_listings" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }) as any);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const { error } = await (supabase
        .from("marketplace_listings" as any)
        .update({ status: newStatus } as any)
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my_listings"] });
      qc.invalidateQueries({ queryKey: ["marketplace_listings"] });
      toast({ title: "Listing updated!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from("marketplace_listings" as any)
        .delete()
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my_listings"] });
      qc.invalidateQueries({ queryKey: ["marketplace_listings"] });
      toast({ title: "Listing deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const active = listings.filter((l: any) => l.status === "active");
  const inactive = listings.filter((l: any) => l.status !== "active");

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/marketplace")} className="w-8 h-8 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-primary-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold font-display text-primary-foreground">My Listings</h1>
            <p className="text-xs text-primary-foreground/70">{listings.length} total listings</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="text-xs font-medium bg-accent text-accent-foreground rounded-lg px-3 py-1.5 flex items-center gap-1">
            <Plus className="w-3 h-3" /> New
          </button>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-card rounded-xl p-6 shadow-card text-center">
            <Fish className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No listings yet. Create your first one!</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Active ({active.length})</h2>
                <div className="space-y-2">
                  {active.map((listing: any, i: number) => (
                    <ListingCard key={listing.id} listing={listing} index={i}
                      onToggle={() => toggleStatus.mutate({ id: listing.id, currentStatus: listing.status })}
                      onDelete={() => deleteListing.mutate(listing.id)} />
                  ))}
                </div>
              </div>
            )}
            {inactive.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Inactive ({inactive.length})</h2>
                <div className="space-y-2">
                  {inactive.map((listing: any, i: number) => (
                    <ListingCard key={listing.id} listing={listing} index={i}
                      onToggle={() => toggleStatus.mutate({ id: listing.id, currentStatus: listing.status })}
                      onDelete={() => deleteListing.mutate(listing.id)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {showForm && <AddListingForm onClose={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["my_listings"] }); }} />}
    </div>
  );
}

function ListingCard({ listing, index, onToggle, onDelete }: { listing: any; index: number; onToggle: () => void; onDelete: () => void }) {
  const isActive = listing.status === "active";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-card rounded-2xl p-4 shadow-card ${!isActive ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-ocean-surface flex items-center justify-center flex-shrink-0">
          <Fish className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{listing.title}</h3>
          <p className="text-xs text-muted-foreground">{listing.species} · {listing.category}</p>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{listing.location}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm font-bold text-foreground">
              {formatTZS(listing.price)}
              <span className="text-xs font-normal text-muted-foreground ml-1">{listing.unit}</span>
            </p>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isActive ? "bg-success-light text-success" : "bg-muted text-muted-foreground"}`}>
              {listing.status}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
        <button onClick={onToggle} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg bg-muted hover:bg-muted/80 transition">
          {isActive ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
          {isActive ? "Deactivate" : "Activate"}
        </button>
        <button onClick={onDelete} className="flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-4 rounded-lg bg-danger-light text-danger hover:bg-danger-light/80 transition">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </motion.div>
  );
}
