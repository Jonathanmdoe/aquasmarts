import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Shield, Key, Monitor, Trash2, LogOut, Eye, EyeOff
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Security() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changing, setChanging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setChanging(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChanging(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") return;
    toast({ title: "Account Deletion", description: "Account deletion requires admin action. Please contact support.", variant: "destructive" });
    setShowDeleteConfirm(false);
    setDeleteText("");
  };

  const sessions = [
    {
      device: "Current Session",
      browser: navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Safari") ? "Safari" : "Browser",
      lastActive: "Now",
      current: true,
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings")} className="w-8 h-8 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-primary-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Security</h1>
            <p className="text-xs text-primary-foreground/70 mt-0.5">Password & account security</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-4">
        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" /> Change Password
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 pr-10"
                />
                <button onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changing || !newPassword || !confirmPassword}
              className="w-full gradient-ocean text-primary-foreground font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
            >
              {changing ? "Updating..." : "Update Password"}
            </button>
          </div>
        </motion.div>

        {/* Active Sessions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" /> Active Sessions
          </h3>
          <div className="space-y-2">
            {sessions.map((session, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 bg-muted/50 rounded-xl px-3">
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{session.device}</p>
                    <p className="text-xs text-muted-foreground">{session.browser} · {session.lastActive}</p>
                  </div>
                </div>
                {session.current && (
                  <span className="text-[10px] font-medium text-success bg-success-light px-2 py-0.5 rounded-full">Active</span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={async () => { await signOut(); navigate("/auth"); }}
            className="w-full mt-3 border border-destructive/20 text-destructive font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out all other sessions
          </button>
        </motion.div>

        {/* Delete Account */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl shadow-card p-4 border border-destructive/20">
          <h3 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete Account
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-destructive/10 text-destructive font-medium py-2.5 rounded-xl text-sm"
            >
              Delete My Account
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-destructive font-medium">Type DELETE to confirm:</p>
              <input
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-destructive/5 border border-destructive/30 rounded-xl px-4 py-2.5 text-sm outline-none text-destructive"
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); }}
                  className="flex-1 bg-muted text-foreground font-medium py-2 rounded-xl text-xs">
                  Cancel
                </button>
                <button onClick={handleDeleteAccount} disabled={deleteText !== "DELETE"}
                  className="flex-1 bg-destructive text-destructive-foreground font-medium py-2 rounded-xl text-xs disabled:opacity-50">
                  Confirm Delete
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
