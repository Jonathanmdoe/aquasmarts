// Receives Selcom payment callbacks and activates the plan or marks the order paid.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const payload = await req.json().catch(() => ({}));
    console.log("[SELCOM-WEBHOOK] payload", JSON.stringify(payload));

    const reference: string =
      payload.order_id || payload.reference || payload.transid || payload.data?.[0]?.order_id;
    const rawStatus: string = String(
      payload.payment_status || payload.result || payload.data?.[0]?.payment_status || "",
    ).toUpperCase();

    if (!reference) return new Response("missing order_id", { status: 400, headers: corsHeaders });

    const paid = ["COMPLETED", "SUCCESS", "PAID"].includes(rawStatus);
    const status = paid ? "paid" : ["CANCELLED", "REJECTED", "FAILED"].includes(rawStatus) ? "failed" : "pending";

    const { data: tx } = await supabase
      .from("payment_transactions")
      .select("id, user_id, purpose, plan")
      .eq("reference", reference)
      .maybeSingle();

    await supabase
      .from("payment_transactions")
      .update({ status, raw: payload })
      .eq("reference", reference);

    if (paid && tx) {
      if (tx.purpose === "subscription" && tx.plan) {
        await supabase
          .from("subscribers_cache")
          .upsert({ user_id: tx.user_id, plan: tx.plan, subscribed: true }, { onConflict: "user_id" });
        await supabase.from("notifications").insert({
          user_id: tx.user_id,
          type: "payment",
          title: "✅ Payment received",
          body: `Your ${tx.plan} plan is now active.`,
          link: "/subscription",
        });
      } else if (tx.purpose === "marketplace") {
        await supabase
          .from("marketplace_orders")
          .update({ payment_status: "paid", status: "confirmed" })
          .eq("stripe_session_id", reference);
        await supabase.from("notifications").insert({
          user_id: tx.user_id,
          type: "payment",
          title: "✅ Payment received",
          body: "Your marketplace order is confirmed.",
          link: "/marketplace?tab=orders",
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[SELCOM-WEBHOOK] error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
