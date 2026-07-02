// Dev-only: creates or ensures a test account with a specific role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "super_admin" | "owner" | "manager" | "worker";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { email, password, fullName, role } = (await req.json()) as {
      email: string; password: string; fullName: string; role: Role;
    };

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Try to find existing user by email
    let userId: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

    if (existing) {
      userId = existing.id;
      // Ensure password + confirmed
      await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
    } else {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (cErr) throw cErr;
      userId = created.user!.id;
    }

    // Ensure profile row (in case trigger missed)
    await admin.from("profiles").upsert(
      { user_id: userId, email, full_name: fullName },
      { onConflict: "user_id" }
    );

    // Assign requested role (do NOT wipe other roles; just add if missing)
    await admin.from("user_roles").upsert(
      { user_id: userId, role },
      { onConflict: "user_id,role" }
    );

    // Owner: ensure a demo farm exists so the dashboard works immediately
    if (role === "owner") {
      const { data: ownFarm } = await admin
        .from("farms")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (!ownFarm) {
        await admin.from("farms").insert({
          user_id: userId,
          name: "Demo Aqua Farm",
          location: "Dar es Salaam, Tanzania",
          operation_type: "grow_out",
          production_system: "ponds",
          market_orientation: "local",
          num_ponds: 3,
          onboarding_complete: true,
        });
      }
    }

    // For non-owner roles that need a farm to exist for dashboards to work,
    // attach them as team members to the seeded owner's farm (or first farm).
    if (role === "manager" || role === "worker") {
      let { data: firstFarm } = await admin
        .from("farms")
        .select("id, user_id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!firstFarm) {
        // No farm on the platform yet — create the demo owner + farm
        const { data: created2 } = await admin.auth.admin.createUser({
          email: "owner@aquasmart.test",
          password: "Owner@12345",
          email_confirm: true,
          user_metadata: { full_name: "Farm Owner" },
        });
        const ownerId = created2?.user?.id;
        if (ownerId) {
          await admin.from("user_roles").upsert({ user_id: ownerId, role: "owner" }, { onConflict: "user_id,role" });
          const { data: nf } = await admin
            .from("farms")
            .insert({ user_id: ownerId, name: "Demo Aqua Farm", location: "Dar es Salaam, Tanzania", operation_type: "grow_out", production_system: "ponds", market_orientation: "local", num_ponds: 3, onboarding_complete: true })
            .select("id, user_id")
            .single();
          firstFarm = nf;
        }
      }
      if (firstFarm) {
        await admin.from("team_members").upsert(
          { farm_id: firstFarm.id, user_id: userId, role, invited_by: firstFarm.user_id },
          { onConflict: "farm_id,user_id" }
        );
      }
    }

    return new Response(JSON.stringify({ ok: true, userId }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message ?? String(e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
