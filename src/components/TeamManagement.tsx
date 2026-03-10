import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, UserX, Crown, Shield, Wrench, Mail, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TeamMember {
  id: string;
  user_id: string;
  role: "owner" | "manager" | "worker";
  is_active: boolean;
  joined_at: string;
  profiles?: { full_name: string | null; email: string | null } | null;
}

interface Invitation {
  id: string;
  email: string;
  role: "owner" | "manager" | "worker";
  status: string;
  created_at: string;
  expires_at: string;
}

const roleConfig = {
  owner: { icon: Crown, label: "Owner", color: "text-amber-600 bg-amber-50" },
  manager: { icon: Shield, label: "Manager", color: "text-primary bg-primary/10" },
  worker: { icon: Wrench, label: "Worker", color: "text-muted-foreground bg-muted" },
};

export default function TeamManagement() {
  const { user } = useAuth();
  const { data: farm } = useFarm();
  const { toast } = useToast();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "worker">("worker");
  const [sending, setSending] = useState(false);

  const fetchTeam = async () => {
    if (!farm?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [membersRes, invitesRes] = await Promise.all([
      supabase
        .from("team_members")
        .select("id, user_id, role, is_active, joined_at")
        .eq("farm_id", farm.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("team_invitations")
        .select("*")
        .eq("farm_id", farm.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

    if (membersRes.data) {
      // Fetch profiles for each member
      const userIds = membersRes.data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const enriched = membersRes.data.map((m) => ({
        ...m,
        role: m.role as TeamMember["role"],
        profiles: profiles?.find((p) => p.user_id === m.user_id) ?? null,
      }));
      setMembers(enriched);
    }

    if (invitesRes.data) {
      setInvitations(invitesRes.data.map(inv => ({ ...inv, role: inv.role as Invitation["role"] })));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTeam();
  }, [farm?.id]);

  const handleInvite = async () => {
    if (!farm?.id || !user?.id || !inviteEmail.trim()) return;
    setSending(true);

    const { error } = await supabase.from("team_invitations").insert({
      farm_id: farm.id,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      invited_by: user.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invitation sent", description: `Invited ${inviteEmail} as ${inviteRole}` });
      setInviteEmail("");
      setInviteOpen(false);
      fetchTeam();
    }
    setSending(false);
  };

  const toggleActive = async (memberId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("team_members")
      .update({ is_active: !currentActive })
      .eq("id", memberId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentActive ? "Member deactivated" : "Member reactivated" });
      fetchTeam();
    }
  };

  const cancelInvitation = async (invId: string) => {
    const { error } = await supabase
      .from("team_invitations")
      .update({ status: "cancelled" })
      .eq("id", invId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invitation cancelled" });
      fetchTeam();
    }
  };

  const updateRole = async (memberId: string, newRole: "manager" | "worker") => {
    const { error } = await supabase
      .from("team_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role updated" });
      fetchTeam();
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl shadow-card p-6 text-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header + Invite */}
      <div className="bg-card rounded-2xl shadow-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Team Members ({members.length})
          </h3>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
                <UserPlus className="w-3.5 h-3.5" /> Invite
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-base">Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="worker@example.com"
                      className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "manager" | "worker")}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="worker">Worker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <button
                  onClick={handleInvite}
                  disabled={sending || !inviteEmail.trim()}
                  className="w-full gradient-ocean text-primary-foreground font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Members list */}
        <div className="space-y-2">
          {members.map((member) => {
            const config = roleConfig[member.role];
            const isOwner = member.role === "owner";
            const isSelf = member.user_id === user?.id;
            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  member.is_active ? "border-border/50 bg-background" : "border-border/30 bg-muted/30 opacity-60"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.color}`}>
                  <config.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.profiles?.full_name || "Unnamed"} {isSelf && "(You)"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.profiles?.email || "No email"}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!isOwner && !isSelf && (
                    <>
                      <Select
                        value={member.role}
                        onValueChange={(v) => updateRole(member.id, v as "manager" | "worker")}
                      >
                        <SelectTrigger className="h-7 text-xs w-24 rounded-lg border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="worker">Worker</SelectItem>
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => toggleActive(member.id, member.is_active)}
                        className="p-1.5 rounded-lg hover:bg-muted"
                        title={member.is_active ? "Deactivate" : "Reactivate"}
                      >
                        {member.is_active ? (
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </>
                  )}
                  {isOwner && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Owner</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-card rounded-2xl shadow-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Pending Invitations ({invitations.length})
          </h3>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {roleConfig[inv.role].label} · Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => cancelInvitation(inv.id)}
                  className="p-1.5 rounded-lg hover:bg-danger-light"
                  title="Cancel invitation"
                >
                  <Trash2 className="w-4 h-4 text-danger" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
