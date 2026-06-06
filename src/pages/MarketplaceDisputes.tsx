import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AlertTriangle, CheckCircle2, Send, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function MarketplaceDisputes() {
  const { id } = useParams();
  if (id) return <DisputeChat id={id} />;
  return <DisputeList />;
}

function DisputeList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: disputes = [] } = useQuery({
    queryKey: ["disputes", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("marketplace_disputes" as any).select("*").or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`).order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  const open = disputes.filter((d: any) => d.status === "open" || d.status === "escalated");
  const resolved = disputes.filter((d: any) => d.status === "resolved" || d.status === "refunded");
  const avg = resolved.length
    ? Math.round(resolved.reduce((s: number, d: any) => s + (new Date(d.resolved_at || d.updated_at).getTime() - new Date(d.created_at).getTime()), 0) / resolved.length / 36e5)
    : 0;

  return (
    <div className="min-h-screen pb-6">
      <div className="gradient-ocean px-4 pt-10 pb-5">
        <button onClick={() => navigate(-1)} className="text-primary-foreground/80 mb-2 flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
        <h1 className="text-xl font-bold font-display text-primary-foreground">Dispute Centre</h1>
        <p className="text-xs text-primary-foreground/70">Mediated resolution for orders</p>
      </div>

      <div className="px-4 -mt-3 grid grid-cols-3 gap-2">
        <Stat label="Open" value={open.length} tone="warning" />
        <Stat label="Resolved" value={resolved.length} tone="success" />
        <Stat label="Avg hrs" value={avg} tone="primary" />
      </div>

      <div className="px-4 pt-4 space-y-2">
        {disputes.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">No disputes — keep it clean!</div>
        ) : disputes.map((d: any) => (
          <button key={d.id} onClick={() => navigate(`/marketplace/disputes/${d.id}`)}
            className="w-full text-left bg-card rounded-2xl p-3 shadow-card flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${d.status === "open" ? "bg-warning/15 text-warning" : "bg-success-light text-success"}`}>
              {d.status === "open" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{d.reason}</p>
              <p className="text-[11px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p>
            </div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">{d.status}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: any) {
  const colors: any = { warning: "bg-warning/15 text-warning", success: "bg-success-light text-success", primary: "bg-primary/10 text-primary" };
  return (
    <div className="bg-card rounded-2xl p-3 shadow-card text-center">
      <p className={`inline-block text-lg font-bold px-2 rounded ${colors[tone]}`}>{value}</p>
      <p className="text-[10px] uppercase text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function DisputeChat({ id }: { id: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const { data: dispute } = useQuery({
    queryKey: ["dispute", id],
    queryFn: async () => {
      const { data } = await supabase.from("marketplace_disputes" as any).select("*").eq("id", id).single();
      return data as any;
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["dispute_msgs", id],
    queryFn: async () => {
      const { data } = await supabase.from("marketplace_dispute_messages" as any).select("*").eq("dispute_id", id).order("created_at");
      return (data as any[]) || [];
    },
  });

  useEffect(() => {
    const ch = supabase.channel(`dispute-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "marketplace_dispute_messages", filter: `dispute_id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["dispute_msgs", id] })).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  const send = async () => {
    if (!text.trim() || !dispute) return;
    const role = user!.id === dispute.buyer_id ? "buyer" : "seller";
    const { error } = await supabase.from("marketplace_dispute_messages" as any).insert({
      dispute_id: id, sender_id: user!.id, sender_role: role, message: text.trim(),
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setText("");
  };

  const updateStatus = async (status: string) => {
    const { error } = await supabase.from("marketplace_disputes" as any).update({
      status, resolved_at: ["resolved", "refunded"].includes(status) ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["dispute", id] });
    toast({ title: `Marked ${status}` });
  };

  if (!dispute) return <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="gradient-ocean px-4 pt-10 pb-4">
        <button onClick={() => navigate("/marketplace/disputes")} className="text-primary-foreground/80 mb-2 flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Disputes</button>
        <h1 className="text-base font-bold font-display text-primary-foreground">{dispute.reason}</h1>
        <p className="text-xs text-primary-foreground/70 flex items-center gap-1"><Clock className="w-3 h-3" /> Opened {new Date(dispute.created_at).toLocaleString()}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No messages yet — explain the situation.</p>}
        {messages.map((m: any) => {
          const mine = m.sender_id === user!.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${mine ? "bg-primary text-primary-foreground" : m.sender_role === "mediator" ? "bg-accent/20 text-foreground border border-accent" : "bg-card shadow-card"}`}>
                <p className="text-[10px] uppercase font-bold opacity-70">{m.sender_role}</p>
                <p className="text-sm">{m.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      {dispute.status === "open" && (
        <div className="px-4 py-2 flex gap-2 border-t border-border">
          <button onClick={() => updateStatus("resolved")} className="flex-1 text-xs font-semibold bg-success text-success-foreground py-2 rounded-lg">Accept Resolution</button>
          <button onClick={() => updateStatus("escalated")} className="flex-1 text-xs font-semibold bg-warning text-warning-foreground py-2 rounded-lg">Escalate</button>
          <button onClick={() => updateStatus("refunded")} className="flex-1 text-xs font-semibold bg-destructive text-destructive-foreground py-2 rounded-lg">Refund</button>
        </div>
      )}

      <div className="p-3 border-t border-border bg-card flex gap-2 sticky bottom-0">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…" className="flex-1 rounded-xl bg-background border border-border px-3 py-2 text-sm" />
        <button onClick={send} className="bg-primary text-primary-foreground p-2 rounded-xl"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
