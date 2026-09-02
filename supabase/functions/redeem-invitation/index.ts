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

    const body = await req.json().catch(() => ({}));
    const code = String((body as any).code ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9]{6,12}$/.test(code)) return json({ error: "Invalid code format" }, 400);

    const { data: inv } = await admin
      .from("team_invitations")
      .select("id, farm_id, role, status, expires_at")
      .eq("code", code)
      .maybeSingle();

    if (!inv) return json({ error: "Invitation code not found" }, 404);
    if (inv.status !== "pending") return json({ error: "This invitation is no longer valid" }, 400);
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      return json({ error: "This invitation has expired" }, 400);
    }

    const { data: farm } = await admin
      .from("farms").select("id, name").eq("id", inv.farm_id).maybeSingle();
    if (!farm) return json({ error: "Farm not found" }, 404);

    // Already a member?
    const { data: existingMember } = await admin
      .from("team_members")
      .select("id")
      .eq("farm_id", inv.farm_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      await admin.from("team_members")
        .update({ role: inv.role, is_active: true })
        .eq("id", existingMember.id);
    } else {
      const { error: mErr } = await admin.from("team_members").insert({
        farm_id: inv.farm_id,
        user_id: user.id,
        role: inv.role,
        is_active: true,
      });
      if (mErr) return json({ error: mErr.message }, 400);
    }

    await admin.from("user_roles").upsert(
      { user_id: user.id, role: inv.role },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );

    await admin.from("team_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_by: user.id })
      .eq("id", inv.id);

    await admin.from("notifications").insert({
      user_id: user.id,
      farm_id: inv.farm_id,
      type: "team_invite",
      title: `You joined ${farm.name}`,
      body: `You are now a ${inv.role} on ${farm.name}.`,
      link: "/",
    });

    return json({ ok: true, farm_name: farm.name, role: inv.role });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
