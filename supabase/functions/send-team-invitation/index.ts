import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: { user }, error: uErr } = await userClient.auth.getUser();
    if (uErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const role = String(body.role ?? "worker");
    const farm_id = String(body.farm_id ?? "");
    const redirect_to = String(body.redirect_to ?? "");

    if (!email || !farm_id) return json({ error: "email and farm_id required" }, 400);
    if (!["manager", "worker"].includes(role)) return json({ error: "invalid role" }, 400);

    // Verify caller owns / manages the farm
    const { data: farm } = await admin.from("farms").select("id, user_id, name").eq("id", farm_id).maybeSingle();
    if (!farm) return json({ error: "Farm not found" }, 404);

    let allowed = farm.user_id === user.id;
    if (!allowed) {
      const { data: tm } = await admin.from("team_members")
        .select("role").eq("farm_id", farm_id).eq("user_id", user.id)
        .in("role", ["owner", "manager"]).maybeSingle();
      allowed = !!tm;
    }
    if (!allowed) return json({ error: "Not allowed to invite for this farm" }, 403);

    // Create invitation row (service role bypasses RLS)
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: inv, error: invErr } = await admin.from("team_invitations").insert({
      farm_id, email, role, invited_by: user.id, status: "pending", expires_at: expires,
    }).select().single();
    if (invErr) return json({ error: invErr.message }, 400);

    // Send the invitation email through Supabase Auth (uses built-in email delivery)
    const { error: mailErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: email.split("@")[0],
        requested_role: role,
        invitation_id: inv.id,
        farm_name: farm.name,
      },
      redirectTo: redirect_to || undefined,
    });

    if (mailErr) {
      // Roll back invitation row so the UI can retry cleanly
      await admin.from("team_invitations").delete().eq("id", inv.id);
      return json({ error: mailErr.message }, 400);
    }

    return json({ ok: true, invitation_id: inv.id });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
