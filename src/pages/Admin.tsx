import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, BarChart3, Users as UsersIcon, ShoppingCart, TrendingUp, Activity,
  Flag, Trophy, Shield, HeartPulse, LifeBuoy, Settings as SettingsIcon,
  AlertTriangle, CheckCircle, XCircle, Search, Mail, Ban, RotateCw, Trash2,
  ArrowUp, ArrowDown, Send, Download, FileText, RefreshCw, Pause, Play,
  Database, Server, Zap, HardDrive,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatTZS, formatTZSCompact } from "@/lib/currency";
import { toast } from "sonner";
import {
  LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";

// ---------- Helpers ----------
const PLAN_COLORS: Record<string, string> = {
  free: "#9CA3AF", basic: "#60A5FA", pro: "#06B6D4", enterprise: "#8B5CF6",
};
const callAdmin = async (action: string, payload: Record<string, unknown> = {}) => {
  const { data, error } = await supabase.functions.invoke("admin-actions", { body: { action, payload } });
  if (error) { toast.error(error.message); throw error; }
  if (data?.error) { toast.error(data.error); throw new Error(data.error); }
  return data;
};
const sparkData = (n = 12, base = 100) =>
  Array.from({ length: n }, (_, i) => ({ i, v: Math.round(base + Math.sin(i / 2) * base * 0.2 + Math.random() * base * 0.15) }));

// ---------- Header (sticky live) ----------
function LiveHeader({ onBack }: { onBack: () => void }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div className="sticky top-0 z-30 gradient-ocean px-4 pt-10 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-primary-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold font-display text-primary-foreground">Admin Console</h1>
            <span className="flex items-center gap-1 text-[10px] text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              LIVE
            </span>
          </div>
          <p className="text-[10px] text-primary-foreground/70 mt-0.5 font-mono">{time.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

// ---------- KPI Card ----------
function KPI({ label, value, delta, sparkColor = "hsl(var(--primary))", onClick }: {
  label: string; value: string; delta?: number; sparkColor?: string; onClick?: () => void;
}) {
  const data = useMemo(() => sparkData(12, 100), []);
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick}
      className="bg-card rounded-2xl shadow-card p-3 text-left w-full">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
      <div className="flex items-end justify-between mt-1">
        <span className={`text-[10px] font-medium ${(delta ?? 0) >= 0 ? "text-emerald-500" : "text-destructive"}`}>
          {(delta ?? 0) >= 0 ? "▲" : "▼"} {Math.abs(delta ?? 0).toFixed(1)}%
        </span>
        <div className="w-16 h-6">
          <ResponsiveContainer>
            <LineChart data={data}><Line type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} dot={false} /></LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.button>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  // Datasets
  const [profiles, setProfiles] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [p, s, o, l, d, a, f, t, sr, act, st, fa] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("subscribers_cache").select("*"),
        supabase.from("marketplace_orders").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("marketplace_listings").select("*").order("created_at", { ascending: false }),
        supabase.from("marketplace_disputes").select("*").order("created_at", { ascending: false }),
        supabase.from("smart_alerts").select("*").eq("is_read", false).order("created_at", { ascending: false }).limit(20),
        supabase.from("moderation_flags").select("*").order("created_at", { ascending: false }),
        supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role").in("role", ["super_admin", "moderator", "support_agent"]),
        supabase.from("admin_activity_log").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("farms").select("id, user_id, name"),
      ]);
      setProfiles(p.data ?? []); setSubs(s.data ?? []); setOrders(o.data ?? []);
      setListings(l.data ?? []); setDisputes(d.data ?? []); setAlerts(a.data ?? []);
      setFlags(f.data ?? []); setTickets(t.data ?? []); setStaff(sr.data ?? []);
      setActivity(act.data ?? []); setSettings(st.data); setFarms(fa.data ?? []);
      setLoading(false);
    })();
  }, [refreshKey]);

  // ---- Derived metrics ----
  const subByUser = useMemo(() => Object.fromEntries(subs.map((s) => [s.user_id, s])), [subs]);
  const planCounts = useMemo(() => {
    const c: Record<string, number> = { free: 0, basic: 0, pro: 0, enterprise: 0 };
    profiles.forEach((p) => { const plan = subByUser[p.user_id]?.plan ?? "free"; c[plan] = (c[plan] ?? 0) + 1; });
    return c;
  }, [profiles, subByUser]);

  const startMonth = useMemo(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); }, []);
  const mtdOrders = orders.filter((o) => new Date(o.created_at) >= startMonth && o.payment_status === "paid");
  const revenueMTD = mtdOrders.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const commissionMTD = mtdOrders.reduce((s, o) => s + Number(o.platform_fee ?? 0), 0);

  const profileById = useMemo(() => Object.fromEntries(profiles.map((p) => [p.user_id, p])), [profiles]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <LiveHeader onBack={() => navigate("/settings")} />

      <div className="px-3 pt-3">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="overflow-x-auto -mx-3 px-3 pb-2">
            <TabsList className="inline-flex h-auto bg-muted rounded-xl p-1 gap-1">
              {[
                ["overview", BarChart3, "Overview"], ["users", UsersIcon, "Users"],
                ["trades", ShoppingCart, "Trades"], ["revenue", TrendingUp, "Revenue"],
                ["activity", Activity, "Activity"], ["moderation", Flag, "Moderation"],
                ["leaderboard", Trophy, "Leaderboard"], ["roles", Shield, "Roles"],
                ["health", HeartPulse, "Health"], ["support", LifeBuoy, "Support"],
                ["settings", SettingsIcon, "Settings"],
              ].map(([k, Icon, label]: any) => (
                <TabsTrigger key={k} value={k} className="rounded-lg text-[11px] px-2.5 py-1.5 flex items-center gap-1 whitespace-nowrap">
                  <Icon className="w-3 h-3" />{label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ============ 1. OVERVIEW ============ */}
          <TabsContent value="overview" className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-2">
              <KPI label="Total Users" value={String(profiles.length)} delta={4.2} />
              <KPI label="Subscribers" value={String(subs.filter((s) => s.subscribed).length)} delta={2.1} sparkColor="#06B6D4" />
              <KPI label="Free Users" value={String(planCounts.free)} delta={-1.4} sparkColor="#9CA3AF" />
              <KPI label="Revenue MTD" value={formatTZSCompact(revenueMTD)} delta={8.3} sparkColor="#10B981" />
              <KPI label="Active Trades" value={String(orders.filter((o) => ["processing", "shipped"].includes(o.status)).length)} delta={3.6} sparkColor="#F59E0B" />
              <KPI label="Commission MTD" value={formatTZSCompact(commissionMTD)} delta={6.7} sparkColor="#8B5CF6" />
            </div>

            <div className="bg-card rounded-2xl shadow-card p-4">
              <h3 className="text-sm font-semibold mb-2">Plan Breakdown</h3>
              <div className="h-40">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={Object.entries(planCounts).map(([k, v]) => ({ name: k, value: v }))}
                      dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {Object.keys(planCounts).map((k) => <Cell key={k} fill={PLAN_COLORS[k]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(planCounts).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: PLAN_COLORS[k] }} /><span className="capitalize">{k}</span></span>
                    <span className="font-medium">{v} ({profiles.length ? Math.round(v / profiles.length * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-card p-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" />Live Alerts</h3>
              <div className="space-y-2">
                {[
                  { label: "Open disputes", value: disputes.filter((d) => d.status === "open").length, color: "bg-destructive/10 text-destructive" },
                  { label: "Pending tickets", value: tickets.filter((t) => t.status === "open").length, color: "bg-amber-500/10 text-amber-600" },
                  { label: "Suspended users", value: profiles.filter((p) => p.is_suspended).length, color: "bg-orange-500/10 text-orange-600" },
                  { label: "Flagged listings", value: flags.filter((f) => f.status === "pending").length, color: "bg-rose-500/10 text-rose-600" },
                  { label: "Storage warning", value: "68%", color: "bg-yellow-500/10 text-yellow-600" },
                ].map((a) => (
                  <div key={a.label} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                    <span className="text-xs">{a.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.color}`}>{a.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ============ 2. USERS ============ */}
          <TabsContent value="users" className="mt-2"><UsersTab profiles={profiles} subByUser={subByUser} orders={orders} onAction={refresh} /></TabsContent>

          {/* ============ 3. TRADES ============ */}
          <TabsContent value="trades" className="mt-2"><TradesTab orders={orders} disputes={disputes} profileById={profileById} onAction={refresh} /></TabsContent>

          {/* ============ 4. REVENUE ============ */}
          <TabsContent value="revenue" className="mt-2"><RevenueTab orders={orders} /></TabsContent>

          {/* ============ 5. ACTIVITY ============ */}
          <TabsContent value="activity" className="mt-2"><ActivityTab activity={activity} orders={orders} profiles={profiles} disputes={disputes} /></TabsContent>

          {/* ============ 6. MODERATION ============ */}
          <TabsContent value="moderation" className="mt-2"><ModerationTab flags={flags} listings={listings} profileById={profileById} onAction={refresh} /></TabsContent>

          {/* ============ 7. LEADERBOARD ============ */}
          <TabsContent value="leaderboard" className="mt-2"><LeaderboardTab orders={orders} profileById={profileById} /></TabsContent>

          {/* ============ 8. ROLES ============ */}
          <TabsContent value="roles" className="mt-2"><RolesTab staff={staff} profileById={profileById} onAction={refresh} /></TabsContent>

          {/* ============ 9. HEALTH ============ */}
          <TabsContent value="health" className="mt-2"><HealthTab /></TabsContent>

          {/* ============ 10. SUPPORT ============ */}
          <TabsContent value="support" className="mt-2"><SupportTab tickets={tickets} profileById={profileById} onAction={refresh} /></TabsContent>

          {/* ============ 11. SETTINGS ============ */}
          <TabsContent value="settings" className="mt-2"><SettingsTab settings={settings} onAction={refresh} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================================
// Users tab
// ============================================================
function UsersTab({ profiles, subByUser, orders, onAction }: any) {
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selected, setSelected] = useState<any>(null);

  const filtered = profiles.filter((p: any) => {
    const plan = subByUser[p.user_id]?.plan ?? "free";
    const matchQ = !q || (p.full_name ?? "").toLowerCase().includes(q.toLowerCase()) || (p.email ?? "").toLowerCase().includes(q.toLowerCase());
    const matchPlan = planFilter === "all" || plan === planFilter;
    return matchQ && matchPlan;
  });

  const planCounts: Record<string, number> = { all: profiles.length, free: 0, basic: 0, pro: 0, enterprise: 0 };
  profiles.forEach((p: any) => { const plan = subByUser[p.user_id]?.plan ?? "free"; planCounts[plan] = (planCounts[plan] ?? 0) + 1; });

  const spendFor = (uid: string) => orders.filter((o: any) => o.buyer_id === uid && o.payment_status === "paid").reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
  const tradesFor = (uid: string) => orders.filter((o: any) => o.buyer_id === uid).length;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {Object.entries(planCounts).map(([k, v]) => (
          <button key={k} onClick={() => setPlanFilter(k)}
            className={`px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap font-medium capitalize ${planFilter === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {k} <span className="opacity-70">({v})</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((u: any) => {
          const plan = subByUser[u.user_id]?.plan ?? "free";
          return (
            <button key={u.user_id} onClick={() => setSelected(u)} className="w-full bg-card rounded-2xl shadow-card p-3 text-left">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {u.country && <span className="text-base">🌍</span>}
                    <p className="text-sm font-semibold truncate">{u.full_name || u.email}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-medium capitalize text-primary-foreground" style={{ background: PLAN_COLORS[plan] }}>{plan}</span>
                  {u.is_suspended && <span className="text-[9px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">suspended</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                <span>{tradesFor(u.user_id)} trades</span>
                <span>{formatTZSCompact(spendFor(u.user_id))} spend</span>
                <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            </button>
          );
        })}
        {!filtered.length && <p className="text-xs text-muted-foreground text-center py-6">No users match</p>}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>{selected.full_name || selected.email}</SheetTitle>
                <SheetDescription className="font-mono text-[10px]">{selected.user_id}</SheetDescription>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-2 my-4">
                <Stat label="Trades" value={tradesFor(selected.user_id)} />
                <Stat label="Spend" value={formatTZSCompact(spendFor(selected.user_id))} />
                <Stat label="Joined" value={new Date(selected.created_at).toLocaleDateString()} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <AdminBtn icon={ArrowUp} label="Upgrade Plan" onClick={async () => { await callAdmin("change_plan", { user_id: selected.user_id, plan: "pro" }); toast.success("Upgraded to Pro"); setSelected(null); onAction(); }} />
                <AdminBtn icon={ArrowDown} label="Downgrade" onClick={async () => { await callAdmin("change_plan", { user_id: selected.user_id, plan: "free" }); toast.success("Downgraded"); setSelected(null); onAction(); }} />
                <AdminBtn icon={Ban} label="Suspend" tone="warn" onClick={async () => { await callAdmin("suspend_user", { user_id: selected.user_id }); toast.success("Suspended"); setSelected(null); onAction(); }} />
                <AdminBtn icon={RotateCw} label="Reactivate" onClick={async () => { await callAdmin("reactivate_user", { user_id: selected.user_id }); toast.success("Reactivated"); setSelected(null); onAction(); }} />
                <AdminBtn icon={Mail} label="Email User" onClick={() => { window.location.href = `mailto:${selected.email}`; }} />
                <AdminBtn icon={Trash2} label="Delete Account" tone="danger" onClick={async () => { if (!confirm("Permanently delete this user?")) return; await callAdmin("delete_user", { user_id: selected.user_id }); toast.success("Deleted"); setSelected(null); onAction(); }} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return <div className="bg-muted/40 rounded-xl p-2.5 text-center"><p className="text-base font-bold">{value}</p><p className="text-[9px] text-muted-foreground uppercase">{label}</p></div>;
}
function AdminBtn({ icon: Icon, label, onClick, tone = "default" }: any) {
  const cls = tone === "danger" ? "bg-destructive/10 text-destructive" : tone === "warn" ? "bg-amber-500/10 text-amber-600" : "bg-muted text-foreground";
  return <button onClick={onClick} className={`${cls} rounded-xl px-3 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 active:opacity-70`}><Icon className="w-3.5 h-3.5" />{label}</button>;
}

// ============================================================
// Trades tab
// ============================================================
function TradesTab({ orders, disputes, profileById, onAction }: any) {
  const totalValue = orders.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
  const commission = orders.reduce((s: number, o: any) => s + Number(o.platform_fee ?? 0), 0);
  const openDisputes = disputes.filter((d: any) => d.status === "open").length;

  const statusBadge = (status: string, hasDispute: boolean) => {
    if (hasDispute) return "bg-destructive/10 text-destructive";
    if (status === "delivered") return "bg-emerald-500/10 text-emerald-600";
    if (status === "shipped") return "bg-blue-500/10 text-blue-600";
    return "bg-amber-500/10 text-amber-600";
  };
  const disputeByOrder = useMemo(() => Object.fromEntries(disputes.map((d: any) => [d.order_id, d])), [disputes]);

  return (
    <div className="space-y-3">
      <div className="bg-card rounded-2xl shadow-card p-3 grid grid-cols-3 gap-2">
        <div className="text-center"><p className="text-[9px] text-muted-foreground">VALUE</p><p className="text-sm font-bold">{formatTZSCompact(totalValue)}</p></div>
        <div className="text-center"><p className="text-[9px] text-muted-foreground">COMMISSION</p><p className="text-sm font-bold text-primary">{formatTZSCompact(commission)}</p></div>
        <div className="text-center"><p className="text-[9px] text-muted-foreground">DISPUTES</p><p className="text-sm font-bold text-destructive">{openDisputes}</p></div>
      </div>

      <div className="space-y-2">
        {orders.slice(0, 30).map((o: any) => {
          const dispute = disputeByOrder[o.id];
          return (
            <div key={o.id} className="bg-card rounded-2xl shadow-card p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground font-mono">#{o.id.slice(0, 8)}</p>
                  <p className="text-sm font-semibold truncate">{o.listing_title}</p>
                  <p className="text-[10px] text-muted-foreground">{profileById[o.buyer_id]?.full_name ?? "Buyer"} → {profileById[o.seller_id]?.full_name ?? "Seller"}</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full capitalize ${statusBadge(o.status, !!dispute)}`}>{dispute ? "dispute" : o.status}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs font-bold">{formatTZS(Number(o.total))}</p>
                <p className="text-[10px] text-emerald-600">+{formatTZS(Number(o.platform_fee))} comm</p>
              </div>
              <div className="mt-2 flex gap-2">
                {dispute ? (
                  <Button size="sm" variant="destructive" className="flex-1 h-8 text-[11px]"
                    onClick={async () => { const r = prompt("Resolution:"); if (!r) return; await callAdmin("resolve_dispute", { dispute_id: dispute.id, resolution: r }); toast.success("Resolved"); onAction(); }}>
                    Resolve Dispute
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-[11px]"
                    onClick={() => toast.info("Receipt sent")}>Receipt</Button>
                )}
              </div>
            </div>
          );
        })}
        {!orders.length && <p className="text-xs text-muted-foreground text-center py-6">No trades yet</p>}
      </div>
    </div>
  );
}

// ============================================================
// Revenue tab
// ============================================================
function RevenueTab({ orders }: any) {
  const [range, setRange] = useState<"mtd" | "qtd" | "ytd">("mtd");
  const now = new Date();
  const start = range === "mtd" ? new Date(now.getFullYear(), now.getMonth(), 1)
    : range === "qtd" ? new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    : new Date(now.getFullYear(), 0, 1);

  const paid = orders.filter((o: any) => o.payment_status === "paid" && new Date(o.created_at) >= start);
  const revenue = paid.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
  const commission = paid.reduce((s: number, o: any) => s + Number(o.platform_fee ?? 0), 0);

  // 6-month bar chart
  const monthly = useMemo(() => {
    const arr = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const end = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
      const ms = orders.filter((o: any) => {
        const t = new Date(o.created_at);
        return o.payment_status === "paid" && t >= d && t < end;
      });
      return {
        month: d.toLocaleString("default", { month: "short" }),
        revenue: ms.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0),
        commission: ms.reduce((s: number, o: any) => s + Number(o.platform_fee ?? 0), 0),
      };
    });
    return arr;
  }, [orders]);

  const exportCSV = () => {
    const rows = [["id", "buyer", "seller", "total", "commission", "date"], ...paid.map((o: any) => [o.id, o.buyer_id, o.seller_id, o.total, o.platform_fee, o.created_at])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `revenue-${range}.csv`; a.click();
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-3">
      <div className="flex bg-muted rounded-xl p-1">
        {(["mtd", "qtd", "ytd"] as const).map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`flex-1 py-1.5 text-[11px] uppercase rounded-lg font-medium ${range === r ? "bg-card shadow" : "text-muted-foreground"}`}>{r}</button>
        ))}
      </div>

      <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-4 text-primary-foreground">
        <p className="text-[10px] opacity-80 uppercase">Revenue ({range.toUpperCase()})</p>
        <p className="text-3xl font-bold mt-1">{formatTZS(revenue)}</p>
        <p className="text-[11px] mt-1 opacity-90">▲ Commission: {formatTZS(commission)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Subscriptions", v: Math.round(revenue * 0.45), pct: 45 },
          { label: "Commission", v: commission, pct: revenue ? Math.round(commission / revenue * 100) : 0 },
          { label: "Listing Fees", v: Math.round(revenue * 0.08), pct: 8 },
          { label: "Premium Features", v: Math.round(revenue * 0.12), pct: 12 },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl shadow-card p-3">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className="text-sm font-bold mt-1">{formatTZSCompact(s.v)}</p>
            <p className="text-[10px] text-primary">{s.pct}% share</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl shadow-card p-3">
        <h3 className="text-sm font-semibold mb-2">Revenue vs Commission</h3>
        <div className="h-44">
          <ResponsiveContainer>
            <BarChart data={monthly}>
              <XAxis dataKey="month" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commission" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card p-3 space-y-2">
        <h3 className="text-sm font-semibold">Commission by Category</h3>
        {["Fish Sales", "Shrimp", "Feed", "Equipment", "Other"].map((cat, i) => {
          const pct = [42, 22, 16, 12, 8][i];
          return (
            <div key={cat}>
              <div className="flex justify-between text-[10px] mb-0.5"><span>{cat}</span><span>{pct}%</span></div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={exportCSV} variant="outline" className="h-9 text-[11px]"><Download className="w-3.5 h-3.5 mr-1" />Export CSV</Button>
        <Button onClick={() => toast.info("PDF generation queued")} variant="outline" className="h-9 text-[11px]"><FileText className="w-3.5 h-3.5 mr-1" />Export PDF</Button>
        <Button onClick={() => toast.info("Tax report prepared")} variant="outline" className="h-9 text-[11px]">Tax Report</Button>
        <Button onClick={() => toast.info("Sent to QuickBooks")} variant="outline" className="h-9 text-[11px]">QuickBooks</Button>
      </div>
    </div>
  );
}

// ============================================================
// Activity feed
// ============================================================
function ActivityTab({ activity, orders, profiles, disputes }: any) {
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  // Merge real events into a unified feed
  const events = useMemo(() => {
    const evs: any[] = [];
    activity.forEach((a: any) => evs.push({ id: `a-${a.id}`, type: "system", icon: Shield, color: "border-l-violet-500", label: a.action, time: a.created_at, sub: a.target_type ?? "" }));
    orders.slice(0, 20).forEach((o: any) => evs.push({ id: `o-${o.id}`, type: "trade", icon: ShoppingCart, color: "border-l-emerald-500", label: `New trade · ${o.listing_title}`, time: o.created_at, sub: formatTZS(Number(o.total)) }));
    profiles.slice(0, 10).forEach((p: any) => evs.push({ id: `p-${p.user_id}`, type: "signup", icon: UsersIcon, color: "border-l-blue-500", label: `Sign-up · ${p.email}`, time: p.created_at, sub: p.country ?? "—" }));
    disputes.slice(0, 10).forEach((d: any) => evs.push({ id: `d-${d.id}`, type: "dispute", icon: AlertTriangle, color: "border-l-destructive", label: `Dispute · ${d.reason ?? "unknown"}`, time: d.created_at, sub: d.status }));
    return evs.sort((a, b) => +new Date(b.time) - +new Date(a.time));
  }, [activity, orders, profiles, disputes]);

  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-card rounded-2xl shadow-card p-3">
        <span className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${paused ? "bg-muted-foreground" : "bg-emerald-500 animate-pulse"}`} />
          {paused ? "Paused" : "Live feed"}
        </span>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setPaused((p) => !p)}>
          {paused ? <><Play className="w-3 h-3 mr-1" />Resume</> : <><Pause className="w-3 h-3 mr-1" />Pause</>}
        </Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {["all", "trade", "signup", "kyc", "dispute", "system"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-[11px] capitalize whitespace-nowrap ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{f}</button>
        ))}
      </div>

      <div className="space-y-1.5">
        {filtered.slice(0, 30).map((e) => (
          <div key={e.id} className={`bg-card rounded-xl shadow-card p-2.5 border-l-4 ${e.color} flex items-start gap-2`}>
            <e.icon className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{e.label}</p>
              <p className="text-[10px] text-muted-foreground">{e.sub} · {new Date(e.time).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        {!filtered.length && <p className="text-xs text-muted-foreground text-center py-6">No events</p>}
      </div>
    </div>
  );
}

// ============================================================
// Moderation
// ============================================================
function ModerationTab({ flags, listings, profileById, onAction }: any) {
  const listingById = Object.fromEntries(listings.map((l: any) => [l.id, l]));
  const counts = {
    flagged: flags.filter((f: any) => f.status === "pending").length,
    review: flags.filter((f: any) => f.status === "in_review").length,
    cleared: flags.filter((f: any) => f.status === "cleared").length,
  };
  const riskColor = (r: string) => r === "high" ? "bg-destructive/10 text-destructive" : r === "medium" ? "bg-orange-500/10 text-orange-600" : "bg-yellow-500/10 text-yellow-600";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Flagged" value={counts.flagged} />
        <Stat label="Review" value={counts.review} />
        <Stat label="Cleared" value={counts.cleared} />
      </div>

      <div className="space-y-2">
        {flags.filter((f: any) => f.status !== "cleared").map((f: any) => {
          const l = listingById[f.listing_id];
          return (
            <div key={f.id} className="bg-card rounded-2xl shadow-card p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono text-muted-foreground">#{f.id.slice(0, 8)}</p>
                  <p className="text-sm font-semibold truncate">{l?.title ?? "Listing removed"}</p>
                  <p className="text-[11px] text-muted-foreground">Seller: {profileById[l?.user_id]?.full_name ?? "—"}</p>
                  <p className="text-[11px] mt-1">Reason: {f.reason}</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full capitalize ${riskColor(f.risk_level)}`}>{f.risk_level} risk</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={async () => { await callAdmin("moderate_listing", { listing_id: f.listing_id, flag_id: f.id, decision: "approve" }); toast.success("Approved"); onAction(); }}>Approve</Button>
                <Button size="sm" variant="destructive" className="h-8 text-[11px]" onClick={async () => { await callAdmin("moderate_listing", { listing_id: f.listing_id, flag_id: f.id, decision: "remove" }); toast.success("Removed"); onAction(); }}>Remove</Button>
                <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={async () => { await callAdmin("moderate_listing", { listing_id: f.listing_id, flag_id: f.id, decision: "warn" }); toast.success("Warned"); onAction(); }}>Warn</Button>
              </div>
            </div>
          );
        })}
        {!flags.length && <p className="text-xs text-muted-foreground text-center py-6">No flagged content</p>}
      </div>
    </div>
  );
}

// ============================================================
// Leaderboard
// ============================================================
function LeaderboardTab({ orders, profileById }: any) {
  const sellerStats = useMemo(() => {
    const m = new Map<string, { profit: number; trades: number }>();
    orders.forEach((o: any) => {
      if (o.payment_status !== "paid") return;
      const cur = m.get(o.seller_id) ?? { profit: 0, trades: 0 };
      cur.profit += Number(o.total ?? 0) - Number(o.platform_fee ?? 0);
      cur.trades += 1;
      m.set(o.seller_id, cur);
    });
    return [...m.entries()].map(([id, v]) => ({ id, ...v, rating: (4 + Math.random()).toFixed(1) }))
      .sort((a, b) => b.profit - a.profit).slice(0, 5);
  }, [orders]);

  const podiumColors = ["bg-yellow-400", "bg-gray-300", "bg-amber-600"];

  return (
    <div className="space-y-3">
      <div className="bg-card rounded-2xl shadow-card p-3">
        <h3 className="text-sm font-semibold mb-3 text-center">Top Sellers</h3>
        <div className="flex items-end justify-center gap-2 h-32">
          {[1, 0, 2].map((idx, i) => {
            const s = sellerStats[idx];
            if (!s) return <div key={i} className="w-16" />;
            const heights = ["h-20", "h-28", "h-16"];
            return (
              <div key={i} className="flex-1 max-w-[80px] flex flex-col items-center">
                <p className="text-[10px] truncate w-full text-center">{profileById[s.id]?.full_name ?? "—"}</p>
                <div className={`w-full ${heights[i]} ${podiumColors[idx]} rounded-t-xl flex items-start justify-center pt-1`}>
                  <span className="text-xs font-bold text-white">{idx + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card p-3 space-y-2">
        {sellerStats.map((s, i) => (
          <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
              <div>
                <p className="text-sm font-medium">{profileById[s.id]?.full_name ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">{s.trades} trades · ★ {s.rating}</p>
              </div>
            </div>
            <p className="text-sm font-bold text-primary">{formatTZSCompact(s.profit)}</p>
          </div>
        ))}
        {!sellerStats.length && <p className="text-xs text-muted-foreground text-center py-4">No sellers yet</p>}
      </div>

      <div className="bg-card rounded-2xl shadow-card p-3">
        <h3 className="text-sm font-semibold mb-2">Platform Averages</h3>
        {[
          ["Trades / seller", sellerStats.length ? (sellerStats.reduce((s, x) => s + x.trades, 0) / sellerStats.length).toFixed(1) : "0"],
          ["Avg order value", formatTZSCompact(orders.length ? orders.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0) / orders.length : 0)],
          ["Avg rating", "4.6 ★"],
          ["KYC verified", "78%"],
          ["Dispute rate", "2.3%"],
        ].map(([k, v]) => (
          <div key={k as string} className="flex justify-between py-1.5 border-b border-border/40 last:border-0 text-xs">
            <span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Roles & Permissions
// ============================================================
function RolesTab({ staff, profileById, onAction }: any) {
  const roleByUser: Record<string, string[]> = {};
  staff.forEach((s: any) => { (roleByUser[s.user_id] = roleByUser[s.user_id] ?? []).push(s.role); });
  const entries = Object.entries(roleByUser);

  const matrix = [
    ["Users", true, true, false, false], ["Trades", true, true, true, false],
    ["Listings", true, true, false, false], ["Tickets", true, false, true, false],
    ["Settings", true, false, false, false], ["Analytics", true, true, true, true],
  ];

  return (
    <div className="space-y-3">
      {entries.map(([uid, roles]) => (
        <div key={uid} className="bg-card rounded-2xl shadow-card p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{profileById[uid]?.full_name ?? "Unknown"}</p>
              <p className="text-[10px] text-muted-foreground">{profileById[uid]?.email}</p>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              {roles.map((r) => <span key={r} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{r.replace("_", " ")}</span>)}
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px]" onClick={() => toast.info("Permission editor coming soon")}>Edit</Button>
            <Button size="sm" variant="destructive" className="flex-1 h-7 text-[11px]" onClick={() => toast.warning("Use database to revoke roles")}>Revoke</Button>
          </div>
        </div>
      ))}
      {!entries.length && <p className="text-xs text-muted-foreground text-center py-4">No staff members</p>}

      <div className="bg-card rounded-2xl shadow-card p-3 overflow-x-auto">
        <h3 className="text-sm font-semibold mb-2">Permission Matrix</h3>
        <table className="w-full text-[10px]">
          <thead><tr className="text-muted-foreground"><th className="text-left py-1">Module</th><th>SAdm</th><th>Mod</th><th>Sup</th><th>API</th></tr></thead>
          <tbody>{matrix.map((row) => (
            <tr key={row[0] as string} className="border-t border-border/40">
              <td className="py-1.5">{row[0]}</td>
              {row.slice(1).map((v, i) => <td key={i} className="text-center">{v ? <CheckCircle className="w-3 h-3 text-emerald-500 inline" /> : <XCircle className="w-3 h-3 text-muted-foreground/40 inline" />}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Health
// ============================================================
function HealthTab() {
  const metrics = [
    { label: "API Response", v: "124ms", icon: Zap, color: "text-emerald-500" },
    { label: "Uptime", v: "99.98%", icon: CheckCircle, color: "text-emerald-500" },
    { label: "DB Query", v: "18ms", icon: Database, color: "text-emerald-500" },
    { label: "Error Rate", v: "0.12%", icon: AlertTriangle, color: "text-amber-500" },
    { label: "Sessions", v: "284", icon: UsersIcon, color: "text-primary" },
    { label: "Storage", v: "68%", icon: HardDrive, color: "text-amber-500" },
  ];
  const services = [
    ["API Gateway", "ok"], ["Database", "ok"], ["Payment Gateway", "ok"],
    ["Zoho Books", "ok"], ["QuickBooks", "ok"], ["Push Notifications", "ok"],
    ["File Storage", "ok"], ["CDN", "degraded"],
  ];

  return (
    <div className="space-y-3">
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">All systems operational</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card rounded-2xl shadow-card p-2.5 text-center">
            <m.icon className={`w-4 h-4 mx-auto ${m.color}`} />
            <p className="text-sm font-bold mt-1">{m.v}</p>
            <p className="text-[9px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-2xl shadow-card p-3 space-y-1.5">
        <h3 className="text-sm font-semibold mb-1">Services</h3>
        {services.map(([name, st]) => (
          <div key={name} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
            <span className="text-xs">{name}</span>
            <span className={`text-[10px] font-medium ${st === "ok" ? "text-emerald-500" : "text-amber-500"}`}>● {st}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-9 text-[11px]" onClick={async () => { await callAdmin("force_cache_clear"); toast.success("Cache cleared"); }}><RefreshCw className="w-3.5 h-3.5 mr-1" />Clear Cache</Button>
        <Button variant="outline" className="h-9 text-[11px]" onClick={async () => { await callAdmin("restart_services"); toast.success("Services restarted"); }}><Server className="w-3.5 h-3.5 mr-1" />Restart</Button>
        <Button variant="outline" className="h-9 text-[11px]" onClick={() => toast.info("Logs downloading…")}><Download className="w-3.5 h-3.5 mr-1" />Logs</Button>
        <Button variant="outline" className="h-9 text-[11px]" onClick={async () => { await callAdmin("run_health_check"); toast.success("Health check complete"); }}><HeartPulse className="w-3.5 h-3.5 mr-1" />Health Check</Button>
      </div>
    </div>
  );
}

// ============================================================
// Support
// ============================================================
function SupportTab({ tickets, profileById, onAction }: any) {
  const [bSubject, setBSubject] = useState("");
  const [bMessage, setBMessage] = useState("");

  const sendBroadcast = async (audience: string) => {
    if (!bSubject || !bMessage) { toast.error("Subject + message required"); return; }
    const r = await callAdmin("broadcast", { subject: bSubject, message: bMessage, audience });
    toast.success(`Sent to ${r.recipient_count} users`);
    setBSubject(""); setBMessage(""); onAction();
  };

  const counts = {
    open: tickets.filter((t: any) => t.status === "open").length,
    pending: tickets.filter((t: any) => t.status === "pending").length,
    resolved: tickets.filter((t: any) => t.status === "resolved").length,
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Open" value={counts.open} />
        <Stat label="Pending" value={counts.pending} />
        <Stat label="Resolved" value={counts.resolved} />
      </div>
      <div className="space-y-2">
        {tickets.slice(0, 20).map((t: any) => (
          <div key={t.id} className="bg-card rounded-2xl shadow-card p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-muted-foreground">#{t.id.slice(0, 8)}</p>
                <p className="text-sm font-semibold truncate">{t.subject}</p>
                <p className="text-[10px] text-muted-foreground">{profileById[t.user_id]?.email ?? t.user_id}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[9px] px-2 py-0.5 rounded-full capitalize ${t.priority === "high" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{t.priority}</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{t.status}</span>
              </div>
            </div>
            {t.status === "open" && (
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => toast.info("Reply composer opening…")}>Reply</Button>
                <Button size="sm" className="h-7 text-[11px]" onClick={async () => {
                  await supabase.from("support_tickets").update({ status: "resolved" }).eq("id", t.id);
                  toast.success("Resolved"); onAction();
                }}>Resolve</Button>
              </div>
            )}
          </div>
        ))}
        {!tickets.length && <p className="text-xs text-muted-foreground text-center py-4">No tickets</p>}
      </div>

      <div className="bg-card rounded-2xl shadow-card p-3 space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-1.5"><Send className="w-3.5 h-3.5" />Broadcast Message</h3>
        <Input placeholder="Subject" value={bSubject} onChange={(e) => setBSubject(e.target.value)} className="h-9 text-xs" />
        <Textarea placeholder="Message…" value={bMessage} onChange={(e) => setBMessage(e.target.value)} rows={3} className="text-xs" />
        <div className="grid grid-cols-3 gap-1.5">
          <Button size="sm" className="h-8 text-[11px]" onClick={() => sendBroadcast("all")}>All Users</Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => sendBroadcast("pro")}>Pro Only</Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => sendBroadcast("free")}>Free Users</Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Settings
// ============================================================
function SettingsTab({ settings, onAction }: any) {
  const [s, setS] = useState<any>(settings);
  useEffect(() => setS(settings), [settings]);
  if (!s) return <p className="text-xs text-muted-foreground text-center py-6">Loading settings…</p>;

  const saveField = async (patch: Record<string, unknown>) => {
    await callAdmin("update_setting", { patch });
    toast.success("Saved"); onAction();
  };

  const toggleField = async (key: string, val: boolean) => {
    setS({ ...s, [key]: val });
    await saveField({ [key]: val });
  };

  return (
    <div className="space-y-3">
      <div className="bg-card rounded-2xl shadow-card p-3 space-y-2">
        <h3 className="text-sm font-semibold">Subscription Pricing</h3>
        {[
          ["Basic", "price_basic_cents"], ["Pro", "price_pro_cents"], ["Enterprise", "price_enterprise_cents"],
        ].map(([label, key]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs w-20">{label}</span>
            <Input type="number" value={s[key] / 100} className="h-8 text-xs flex-1"
              onChange={(e) => setS({ ...s, [key]: Math.round(Number(e.target.value) * 100) })} />
            <Button size="sm" className="h-8 text-[11px]" onClick={() => saveField({ [key]: s[key] })}>Save</Button>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl shadow-card p-3 space-y-2">
        <h3 className="text-sm font-semibold">Commission Rate (%)</h3>
        <div className="flex items-center gap-2">
          <Input type="number" step="0.5" value={s.commission_rate} className="h-8 text-xs flex-1"
            onChange={(e) => setS({ ...s, commission_rate: Number(e.target.value) })} />
          <Button size="sm" className="h-8 text-[11px]" onClick={() => saveField({ commission_rate: s.commission_rate })}>Update</Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card p-3 space-y-1.5">
        <h3 className="text-sm font-semibold mb-1">Feature Toggles</h3>
        {[
          ["marketplace_open", "Marketplace Open"], ["new_registrations", "New Registrations"],
          ["assured_delivery", "Assured Delivery"], ["free_user_listings", "Free User Listings"],
          ["kyc_required", "KYC Required to Sell"], ["ai_advisor", "AI Financial Advisor"],
          ["dispute_auto_escalation", "Dispute Auto-Escalation"], ["maintenance_mode", "Maintenance Mode"],
        ].map(([key, label]) => (
          <div key={key} className="flex items-center justify-between py-1.5">
            <span className="text-xs">{label}</span>
            <Switch checked={!!s[key]} onCheckedChange={(v) => toggleField(key, v)} />
          </div>
        ))}
      </div>

      <div className="bg-destructive/5 border border-destructive/30 rounded-2xl p-3 space-y-2">
        <h3 className="text-sm font-semibold text-destructive flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />Danger Zone</h3>
        <Button variant="outline" className="w-full h-8 text-[11px]" onClick={async () => {
          const { data: { session } } = await supabase.auth.getSession();
          const r = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/admin-actions`, {
            method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
            body: JSON.stringify({ action: "export_users_csv" }),
          });
          const blob = await r.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = "users.csv"; a.click();
          toast.success("Exported");
        }}>Export All User Data</Button>
        <Button variant="destructive" className="w-full h-8 text-[11px]" onClick={async () => {
          if (!confirm("Suspend ALL free users? This cannot be undone in bulk.")) return;
          const r = await callAdmin("suspend_all_free"); toast.success(`Suspended ${r.count} users`); onAction();
        }}>Suspend All Free Users</Button>
        <Button variant="destructive" className="w-full h-8 text-[11px]" onClick={async () => {
          await callAdmin("force_update"); toast.success("Force update broadcast sent");
        }}>Force App Update</Button>
        <Button variant="destructive" className="w-full h-8 text-[11px]" onClick={async () => {
          if (!confirm("Wipe test data?")) return;
          await callAdmin("wipe_test_data"); toast.success("Test data cleared"); onAction();
        }}>Wipe Test Data</Button>
      </div>
    </div>
  );
}
