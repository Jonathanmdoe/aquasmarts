// Polls Selcom for the live status of a payment and reconciles it locally.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { selcomRequest } from "../_shared/selcom.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData.user;
    if (!user) return json({ error: "Not authenticated" }, 401);

    const { reference } = await req.json().catch(() => ({ reference: "" }));
    if (!reference) return json({ error: "reference is required" }, 400);

    const { data: tx } = await supabase
      .from("payment_transactions")
      .select("id, user_id, purpose, plan, status")
      .eq("reference", reference)
      .maybeSingle();
    if (!tx || tx.user_id !== user.id) return json({ error: "Payment not found" }, 404);
    if (tx.status === "paid") return json({ status: "paid" });

    const res = await selcomRequest<any>("/checkout/order-status", "GET", { order_id: reference });
    const remote = String(res.body?.data?.[0]?.payment_status || "").toUpperCase();
    const paid = ["COMPLETED", "SUCCESS", "PAID"].includes(remote);
    const status = paid ? "paid" : ["CANCELLED", "REJECTED", "FAILED"].includes(remote) ? "failed" : "pending";

    await supabase.from("payment_transactions").update({ status, raw: res.body }).eq("id", tx.id);

    if (paid) {
      if (tx.purpose === "subscription" && tx.plan) {
        await supabase
          .from("subscribers_cache")
          .upsert({ user_id: tx.user_id, plan: tx.plan, subscribed: true }, { onConflict: "user_id" });
      } else if (tx.purpose === "marketplace") {
        await supabase
          .from("marketplace_orders")
          .update({ payment_status: "paid", status: "confirmed" })
          .eq("stripe_session_id", reference);
      }
    }

    return json({ status, provider_status: remote });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("selcom-status error:", msg);
    return json({ error: msg }, 500);
  }
});
