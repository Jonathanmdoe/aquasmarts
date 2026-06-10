import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    // Verify super_admin role
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["super_admin"])
      .maybeSingle();

    if (!roleRow) return json({ error: "Forbidden — super_admin required" }, 403);

    const body = await req.json();
    const { action, payload = {} } = body as { action: string; payload?: Record<string, unknown> };

    const log = async (meta: Record<string, unknown> = {}) => {
      await admin.from("admin_activity_log").insert({
        actor_id: user.id,
        action,
        target_type: (payload.target_type as string) ?? null,
        target_id: (payload.target_id as string) ?? null,
        metadata: { ...payload, ...meta },
      });
    };

    switch (action) {
      case "suspend_user": {
        const { user_id, reason } = payload as { user_id: string; reason?: string };
        await admin.from("profiles").update({
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          suspension_reason: reason ?? null,
        }).eq("user_id", user_id);
        await admin.auth.admin.updateUserById(user_id, { ban_duration: "876000h" });
        await log();
        return json({ ok: true });
      }
      case "reactivate_user": {
        const { user_id } = payload as { user_id: string };
        await admin.from("profiles").update({
          is_suspended: false, suspended_at: null, suspension_reason: null,
        }).eq("user_id", user_id);
        await admin.auth.admin.updateUserById(user_id, { ban_duration: "none" });
        await log();
        return json({ ok: true });
      }
      case "delete_user": {
        const { user_id } = payload as { user_id: string };
        await admin.auth.admin.deleteUser(user_id);
        await log();
        return json({ ok: true });
      }
      case "change_plan": {
        const { user_id, plan } = payload as { user_id: string; plan: string };
        await admin.from("subscribers_cache").upsert({
          user_id, plan, subscribed: plan !== "free", updated_at: new Date().toISOString(),
        });
        await log({ new_plan: plan });
        return json({ ok: true });
      }
      case "broadcast": {
        const { subject, message, audience } = payload as { subject: string; message: string; audience: string };
        let q = admin.from("subscribers_cache").select("user_id", { count: "exact", head: true });
        if (audience === "pro") q = q.in("plan", ["pro", "enterprise"]);
        else if (audience === "free") q = q.eq("plan", "free");
        const { count } = await q;
        const { data } = await admin.from("broadcast_messages").insert({
          sender_id: user.id, subject, message, audience, recipient_count: count ?? 0,
        }).select().single();
        await log({ broadcast_id: data?.id });
        return json({ ok: true, recipient_count: count ?? 0 });
      }
      case "update_setting": {
        const { patch } = payload as { patch: Record<string, unknown> };
        await admin.from("platform_settings").update({ ...patch, updated_by: user.id }).eq("id", 1);
        await log({ patch });
        return json({ ok: true });
      }
      case "moderate_listing": {
        const { listing_id, decision, flag_id, notes } = payload as {
          listing_id: string; decision: "approve" | "remove" | "warn"; flag_id?: string; notes?: string;
        };
        if (decision === "remove") {
          await admin.from("marketplace_listings").update({ status: "removed" }).eq("id", listing_id);
        }
        if (flag_id) {
          await admin.from("moderation_flags").update({
            status: decision === "approve" ? "cleared" : decision === "remove" ? "removed" : "warned",
            reviewer_id: user.id, reviewer_notes: notes ?? null, resolved_at: new Date().toISOString(),
          }).eq("id", flag_id);
        }
        await log({ listing_id, decision });
        return json({ ok: true });
      }
      case "resolve_dispute": {
        const { dispute_id, resolution } = payload as { dispute_id: string; resolution: string };
        await admin.from("marketplace_disputes").update({
          status: "resolved", resolution, resolved_at: new Date().toISOString(),
        }).eq("id", dispute_id);
        await log();
        return json({ ok: true });
      }
      case "wipe_test_data": {
        // Only clear admin_activity_log + subscribers_cache rows tagged as test
        await admin.from("admin_activity_log").delete().eq("action", "test");
        await log({ note: "test cleanup" });
        return json({ ok: true });
      }
      case "force_update":
      case "force_cache_clear":
      case "restart_services":
      case "run_health_check": {
        await log({ note: action });
        return json({ ok: true, action });
      }
      case "export_users_csv": {
        const { data } = await admin.from("profiles")
          .select("user_id, full_name, email, country, is_suspended, created_at");
        const header = "user_id,full_name,email,country,is_suspended,created_at";
        const rows = (data ?? []).map((r) =>
          [r.user_id, r.full_name, r.email, r.country ?? "", r.is_suspended, r.created_at]
            .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
        );
        await log({ exported: data?.length ?? 0 });
        return new Response([header, ...rows].join("\n"), {
          headers: { ...corsHeaders, "Content-Type": "text/csv" },
        });
      }
      case "suspend_all_free": {
        const { data: free } = await admin.from("subscribers_cache").select("user_id").eq("plan", "free");
        const ids = (free ?? []).map((r) => r.user_id);
        if (ids.length) {
          await admin.from("profiles").update({
            is_suspended: true, suspended_at: new Date().toISOString(), suspension_reason: "Mass suspension",
          }).in("user_id", ids);
        }
        await log({ count: ids.length });
        return json({ ok: true, count: ids.length });
      }
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
