import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingCart, Search, Fish, MapPin, Plus, Loader2, ShieldCheck,
  Truck, Package, CheckCircle2, Clock, MessageSquare, Wallet,
  BarChart3, Bell, AlertTriangle, X, Minus, BadgeCheck, Filter
} from "lucide-react";
import { formatTZS } from "@/lib/currency";
import UpgradeGate from "@/components/UpgradeGate";
import AddListingForm from "@/components/forms/AddListingForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type Tab = "browse" | "sell" | "orders" | "earnings";

const CATEGORIES = ["All", "Fingerlings", "Table Fish", "Fry", "Broodstock", "Processed", "Equipment", "Feed"];
const STAGES = ["placed", "packed", "shipped", "delivered"] as const;
const STAGE_LABEL: Record<string, string> = { placed: "Placed", packed: "Packed", shipped: "Shipped", delivered: "Delivered" };

function PlatformBadge() {
  return (
    <div className="bg-ocean-surface border border-primary/15 rounded-xl px-3 py-2 flex items-start gap-2">
      <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[11px] font-semibold text-foreground">Assured Delivery Protection</p>
        <p className="text-[10px] text-muted-foreground">Funds released to seller only after delivery is confirmed.</p>
      </div>
    </div>
  );
}

function StageTracker({ status }: { status: string }) {
  const idx = STAGES.indexOf(status as any);
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((s, i) => (
        <div key={s} className="flex-1 flex items-center gap-1">
          <div className={`flex-1 h-1 rounded-full ${i <= idx ? "bg-primary" : "bg-muted"}`} />
          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {i < idx ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[9px] font-bold">{i + 1}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- BROWSE TAB ---------------- */
function BrowseTab({ onAddToCart, cartCount, onOpenCart }: { onAddToCart: (l: any, qty: number) => void; cartCount: number; onOpenCart: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "price_asc" | "price_desc">("recent");
  const [qty, setQty] = useState<Record<string, string>>({});

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["marketplace_listings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketplace_listings" as any).select("*").eq("status", "active").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => {
    let l = listings.filter((x: any) => {
      const mc = selectedCategory === "All" || x.category?.toLowerCase() === selectedCategory.toLowerCase().replace(" ", "-");
      const ms = !search || x.title?.toLowerCase().includes(search.toLowerCase()) || x.species?.toLowerCase().includes(search.toLowerCase());
      return mc && ms;
    });
    if (sort === "price_asc") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "price_desc") l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [listings, selectedCategory, search, sort]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fish, feed, equipment…"
            className="w-full bg-card rounded-xl pl-10 pr-3 py-2.5 text-sm border border-border outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="bg-card border border-border rounded-xl px-2 py-2.5 text-xs"
        >
          <option value="recent">Newest</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
        </select>
        <button onClick={onOpenCart} className="relative bg-primary text-primary-foreground rounded-xl p-2.5">
          <ShoppingCart className="w-4 h-4" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>
          )}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setSelectedCategory(c)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${selectedCategory === c ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground shadow-card"}`}>
            {c}
          </button>
        ))}
      </div>

      <PlatformBadge />

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <Fish className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No listings match.</p>
        </div>
      ) : (
        filtered.map((l: any, i: number) => (
          <motion.div key={l.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-ocean-surface flex items-center justify-center flex-shrink-0">
                <Fish className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-foreground truncate">{l.title}</h3>
                  <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                </div>
                <p className="text-[11px] text-muted-foreground">{l.species}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {l.location}</p>
              </div>
              {l.survival_guarantee > 0 && (
                <span className="text-[10px] font-medium bg-success-light text-success px-2 py-0.5 rounded-full whitespace-nowrap">{l.survival_guarantee}% survival</span>
              )}
            </div>
            <div className="mt-2 space-y-2">
              <div>
                <p className="text-base font-bold text-foreground">{formatTZS(l.price)} <span className="text-[10px] font-normal text-muted-foreground">per {l.unit}</span></p>
                <p className="text-[10px] text-muted-foreground">{l.quantity} available</p>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Quantity ({l.unit})</label>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={qty[l.id] ?? "1"}
                    onChange={(e) => setQty((q) => ({ ...q, [l.id]: e.target.value }))}
                    className="w-full bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Total</p>
                  <p className="text-sm font-bold text-primary">
                    {formatTZS(Number(l.price) * Math.max(1, Number(qty[l.id] ?? 1) || 1))}
                  </p>
                </div>
                <button
                  onClick={() => onAddToCart(l, Math.max(1, Number(qty[l.id] ?? 1) || 1))}
                  className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}

/* ---------------- SELL TAB ---------------- */
function SellTab({ onOpenForm }: { onOpenForm: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  const qc = useQueryClient();

  const { data: connect } = useQuery({
    queryKey: ["seller_stripe_account", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("seller_stripe_accounts" as any).select("*").eq("user_id", user!.id).maybeSingle();
      return data as any;
    },
    enabled: !!user,
  });

  const { data: kyc } = useQuery({
    queryKey: ["seller_kyc", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("seller_kyc" as any).select("*").eq("user_id", user!.id).maybeSingle();
      return data as any;
    },
    enabled: !!user,
  });

  const startConnect = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("connect-onboard");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
      qc.invalidateQueries({ queryKey: ["seller_stripe_account"] });
    } catch (e: any) {
      toast({ title: "Onboarding error", description: e.message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-4">
        <p className="text-[11px] uppercase tracking-wider opacity-80">Commission</p>
        <p className="text-3xl font-bold font-display">3.5%</p>
        <p className="text-xs opacity-90 mt-1">Per assured order. No monthly fees. Buyer pays. Auto-deducted from your payout.</p>
      </div>

      <div className="bg-card rounded-2xl shadow-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Seller Verification (KYC)</p>
            <p className="text-[11px] text-muted-foreground">Unlocks higher trust + verified badge</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
            kyc?.status === "approved" ? "bg-success-light text-success" :
            kyc?.status === "pending" ? "bg-warning/15 text-warning" :
            "bg-muted text-muted-foreground"
          }`}>
            {kyc?.status?.toUpperCase() || "NOT STARTED"}
          </span>
        </div>
        <button onClick={() => navigate("/marketplace/kyc")} className="w-full text-xs font-semibold bg-primary/10 text-primary py-2.5 rounded-lg">
          {kyc ? "Continue Verification" : "Get Verified"}
        </button>
      </div>

      <div className="bg-card rounded-2xl shadow-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Payout Account (Stripe)</p>
            <p className="text-[11px] text-muted-foreground">Required to receive money from buyers</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
            connect?.payouts_enabled ? "bg-success-light text-success" :
            connect ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
          }`}>
            {connect?.payouts_enabled ? "READY" : connect ? "INCOMPLETE" : "NOT CONNECTED"}
          </span>
        </div>
        <button onClick={startConnect} disabled={connecting} className="w-full text-xs font-semibold bg-primary text-primary-foreground py-2.5 rounded-lg disabled:opacity-50">
          {connecting ? "Opening Stripe…" : connect ? "Manage Payout Account" : "Connect Payout Account"}
        </button>
      </div>

      <button onClick={onOpenForm} className="w-full bg-accent text-accent-foreground rounded-2xl py-3 font-semibold text-sm flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> New Listing
      </button>

      <PlatformBadge />
    </div>
  );
}

/* ---------------- ORDERS TAB ---------------- */
function OrdersTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [view, setView] = useState<"buying" | "selling">("buying");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["marketplace_orders", user?.id, view],
    queryFn: async () => {
      const col = view === "buying" ? "buyer_id" : "seller_id";
      const { data } = await supabase.from("marketplace_orders" as any).select("*").eq(col, user!.id).order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "marketplace_orders" }, () => {
        qc.invalidateQueries({ queryKey: ["marketplace_orders"] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const advance = async (orderId: string, current: string) => {
    const next = STAGES[STAGES.indexOf(current as any) + 1];
    if (!next) return;
    const stampField = `${next}_at`;
    const { error } = await supabase.from("marketplace_orders" as any).update({ status: next, [stampField]: new Date().toISOString() }).eq("id", orderId);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: `Order marked ${STAGE_LABEL[next]}` });
  };

  const openDispute = async (order: any) => {
    const reason = window.prompt("Describe the issue:");
    if (!reason) return;
    const { data, error } = await supabase.from("marketplace_disputes" as any).insert({
      order_id: order.id, opened_by: user!.id, buyer_id: order.buyer_id, seller_id: order.seller_id, reason,
    }).select().single();
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Dispute opened" });
    navigate(`/marketplace/disputes/${(data as any).id}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {(["buying", "selling"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize ${view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {v}
            </button>
          ))}
        </div>
        <button onClick={() => navigate("/marketplace/disputes")} className="text-xs font-medium text-primary flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" /> Disputes
        </button>
      </div>

      <PlatformBadge />

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        orders.map((o: any) => (
          <div key={o.id} className="bg-card rounded-2xl p-4 shadow-card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">{o.listing_title}</p>
                <p className="text-[11px] text-muted-foreground">Qty {o.quantity} · {formatTZS(o.total)}</p>
              </div>
              <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">{o.status}</span>
            </div>
            <StageTracker status={o.status} />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ETA {o.eta ? new Date(o.eta).toLocaleDateString() : "3-5 days"}</span>
              {o.tracking_number && <span>Tracking: {o.tracking_number}</span>}
            </div>
            <div className="flex gap-2">
              {view === "selling" && o.status !== "delivered" && o.status !== "cancelled" && (
                <button onClick={() => advance(o.id, o.status)} className="flex-1 text-xs font-semibold bg-primary text-primary-foreground py-2 rounded-lg">
                  Mark {STAGE_LABEL[STAGES[STAGES.indexOf(o.status as any) + 1]] || "Done"}
                </button>
              )}
              {view === "buying" && (
                <button onClick={() => openDispute(o)} className="flex-1 text-xs font-semibold bg-muted text-foreground py-2 rounded-lg">
                  Report Issue
                </button>
              )}
              <button className="flex-1 text-xs font-semibold bg-muted text-foreground py-2 rounded-lg flex items-center justify-center gap-1">
                <MessageSquare className="w-3 h-3" /> Contact
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------------- EARNINGS TAB ---------------- */
function EarningsTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: orders = [] } = useQuery({
    queryKey: ["seller_orders_earnings", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("marketplace_orders" as any).select("*").eq("seller_id", user!.id);
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  const delivered = orders.filter((o: any) => o.status === "delivered");
  const grossVolume = delivered.reduce((s: number, o: any) => s + Number(o.total), 0);
  const platformCut = delivered.reduce((s: number, o: any) => s + Number(o.platform_fee), 0);
  const netPayout = grossVolume - platformCut;
  const pending = orders.filter((o: any) => !["delivered", "cancelled", "refunded"].includes(o.status));

  const stats = [
    { label: "Trades", value: orders.length },
    { label: "Volume", value: formatTZS(grossVolume) },
    { label: "Pending", value: pending.length },
    { label: "Active Buyers", value: new Set(orders.map((o: any) => o.buyer_id)).size },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-success/90 to-success text-success-foreground rounded-2xl p-4">
        <p className="text-[11px] uppercase tracking-wider opacity-80">Net Earnings (after 3.5% fee)</p>
        <p className="text-3xl font-bold font-display">{formatTZS(netPayout)}</p>
        <p className="text-xs opacity-90 mt-1">Platform fee collected: {formatTZS(platformCut)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-3 shadow-card">
            <p className="text-[10px] uppercase text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <button onClick={() => navigate("/marketplace/analytics")} className="w-full bg-primary/10 text-primary rounded-2xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2">
        <BarChart3 className="w-4 h-4" /> View Full Analytics
      </button>

      <div className="bg-card rounded-2xl shadow-card p-4">
        <p className="text-sm font-semibold mb-2">Recent commission history</p>
        {delivered.length === 0 ? (
          <p className="text-xs text-muted-foreground">No completed orders yet.</p>
        ) : (
          <div className="space-y-2">
            {delivered.slice(0, 8).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium truncate max-w-[180px]">{o.listing_title}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(o.delivered_at || o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatTZS(o.total)}</p>
                  <p className="text-[10px] text-muted-foreground">fee {formatTZS(o.platform_fee)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- CART DRAWER ---------------- */
function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [deliveryType, setDeliveryType] = useState("standard");

  const { data: items = [] } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("marketplace_cart_items" as any)
        .select("id, quantity, listing:marketplace_listings(id,title,price,unit,user_id)")
        .eq("user_id", user!.id);
      return (data as any[]) || [];
    },
    enabled: !!user && open,
  });

  const subtotal = items.reduce((s: number, i: any) => s + Number(i.listing?.price || 0) * i.quantity, 0);
  const fee = Math.round(subtotal * 0.035);

  const updateQty = async (id: string, q: number) => {
    if (q < 1) {
      await supabase.from("marketplace_cart_items" as any).delete().eq("id", id);
    } else {
      await supabase.from("marketplace_cart_items" as any).update({ quantity: q }).eq("id", id);
    }
    qc.invalidateQueries({ queryKey: ["cart"] });
  };

  const checkout = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("marketplace-checkout", {
        body: { delivery_type: deliveryType },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Order placed", description: "Awaiting seller confirmation" });
        qc.invalidateQueries({ queryKey: ["cart"] });
        qc.invalidateQueries({ queryKey: ["marketplace_orders"] });
        onClose();
      }
    } catch (e: any) {
      toast({ title: "Checkout failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div className="bg-card w-full max-w-md mx-auto rounded-t-3xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold">Your Cart</h3>
          <button onClick={onClose} className="p-1 rounded-lg bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Cart is empty</p>
          ) : (
            items.map((i: any) => (
              <div key={i.id} className="bg-muted/50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-ocean-surface flex items-center justify-center">
                    <Fish className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{i.listing?.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatTZS(Number(i.listing?.price))} × {i.quantity} {i.listing?.unit ?? ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold">{formatTZS(Number(i.listing?.price) * i.quantity)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(i.id, i.quantity - 1)} className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={i.quantity}
                    onChange={(e) => updateQty(i.id, Math.max(0, Number(e.target.value) || 0))}
                    className="flex-1 text-center text-sm font-semibold bg-card border border-border rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button onClick={() => updateQty(i.id, i.quantity + 1)} className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            ))
          )}

          {items.length > 0 && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Delivery</label>
                <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}
                  className="w-full mt-1 rounded-xl bg-background border border-border px-3 py-2 text-sm">
                  <option value="standard">Standard (3–5 days)</option>
                  <option value="express">Express (1–2 days)</option>
                  <option value="pickup">Buyer pickup</option>
                </select>
              </div>
              <div className="space-y-1 text-sm pt-2 border-t border-border">
                {items.map((i: any) => (
                  <div key={i.id} className="flex justify-between text-[11px] text-muted-foreground">
                    <span className="truncate max-w-[60%]">{i.listing?.title} ({i.quantity} × {formatTZS(Number(i.listing?.price))})</span>
                    <span>{formatTZS(Number(i.listing?.price) * i.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1"><span className="text-muted-foreground">Subtotal</span><span>{formatTZS(subtotal)}</span></div>
                <div className="flex justify-between text-[11px] text-muted-foreground"><span>Platform fee 3.5% (deducted from seller payout)</span><span>-{formatTZS(fee)}</span></div>
                <div className="flex justify-between font-bold text-base pt-1 border-t border-border mt-1"><span>You pay</span><span>{formatTZS(subtotal)}</span></div>
              </div>
              <button onClick={() => setShowPay(true)} className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Pay with mobile money (TZS)
              </button>
              <button onClick={checkout} disabled={submitting} className="w-full bg-card border border-border text-foreground rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                Pay by card (international)
              </button>
              <MobileMoneyDialog
                open={showPay}
                onOpenChange={setShowPay}
                purpose="marketplace"
                amountTzs={subtotal}
                deliveryType={deliveryType}
                title="Complete your order"
                onPaid={() => {
                  qc.invalidateQueries({ queryKey: ["cart"] });
                  qc.invalidateQueries({ queryKey: ["marketplace_orders"] });
                }}
              />

            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- MAIN ---------------- */
function MarketplaceContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const initialTab = (params.get("tab") as Tab) || "browse";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [showForm, setShowForm] = useState(false);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    if (params.get("checkout") === "success") toast({ title: "Payment successful", description: "Your order has been placed." });
    if (params.get("checkout") === "cancel") toast({ title: "Checkout cancelled" });
  }, []);

  const { data: cartCount = 0 } = useQuery({
    queryKey: ["cart_count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("marketplace_cart_items" as any).select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: unread = 0 } = useQuery({
    queryKey: ["mp_notif_unread", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("marketplace_notifications" as any).select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("read", false);
      return count || 0;
    },
    enabled: !!user,
  });

  const addToCart = async (l: any, qty = 1) => {
    if (!user) return;
    const add = Math.max(1, Math.floor(qty) || 1);
    const { data: existing } = await supabase.from("marketplace_cart_items" as any).select("*").eq("user_id", user.id).eq("listing_id", l.id).maybeSingle();
    if (existing) {
      await supabase.from("marketplace_cart_items" as any).update({ quantity: (existing as any).quantity + add }).eq("id", (existing as any).id);
    } else {
      await supabase.from("marketplace_cart_items" as any).insert({ user_id: user.id, listing_id: l.id, quantity: add });
    }
    qc.invalidateQueries({ queryKey: ["cart"] });
    qc.invalidateQueries({ queryKey: ["cart_count"] });
    toast({ title: "Added to cart", description: `${add} × ${l.title} — ${formatTZS(Number(l.price) * add)}` });
  };


  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "browse", label: "Browse", icon: Search },
    { id: "sell", label: "Sell", icon: Plus },
    { id: "orders", label: "Orders", icon: Package },
    { id: "earnings", label: "Earnings", icon: Wallet },
  ];

  return (
    <div className="min-h-screen pb-6">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Marketplace Pro</h1>
            <p className="text-xs text-primary-foreground/70">Trade with assured delivery</p>
          </div>
          <button onClick={() => navigate("/marketplace/notifications")} className="relative bg-primary-foreground/15 text-primary-foreground p-2 rounded-lg">
            <Bell className="w-4 h-4" />
            {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent animate-pulse" />}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => navigate("/marketplace/kyc")} className="text-[11px] font-medium bg-primary-foreground/15 text-primary-foreground rounded-full px-3 py-1 flex items-center gap-1 whitespace-nowrap">
            <ShieldCheck className="w-3 h-3" /> Get Verified
          </button>
          <button onClick={() => navigate("/marketplace/disputes")} className="text-[11px] font-medium bg-primary-foreground/15 text-primary-foreground rounded-full px-3 py-1 flex items-center gap-1 whitespace-nowrap">
            <AlertTriangle className="w-3 h-3" /> Disputes
          </button>
          <button onClick={() => navigate("/marketplace/analytics")} className="text-[11px] font-medium bg-primary-foreground/15 text-primary-foreground rounded-full px-3 py-1 flex items-center gap-1 whitespace-nowrap">
            <BarChart3 className="w-3 h-3" /> Analytics
          </button>
          <button onClick={() => navigate("/my-listings")} className="text-[11px] font-medium bg-primary-foreground/15 text-primary-foreground rounded-full px-3 py-1 whitespace-nowrap">
            My Listings
          </button>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="flex bg-card rounded-2xl p-1 shadow-card">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setParams({ tab: t.id }); }}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition ${
                  tab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-3">
        {tab === "browse" && <BrowseTab onAddToCart={addToCart} cartCount={cartCount} onOpenCart={() => setShowCart(true)} />}
        {tab === "sell" && <SellTab onOpenForm={() => setShowForm(true)} />}
        {tab === "orders" && <OrdersTab />}
        {tab === "earnings" && <EarningsTab />}
      </div>

      {showForm && <AddListingForm onClose={() => setShowForm(false)} />}
      <CartDrawer open={showCart} onClose={() => setShowCart(false)} />
    </div>
  );
}

export default function Marketplace() {
  return (
    <UpgradeGate feature="marketplace" fallbackMessage="Access Marketplace Pro to buy, sell, and ship with assured delivery. Upgrade to unlock.">
      <MarketplaceContent />
    </UpgradeGate>
  );
}
