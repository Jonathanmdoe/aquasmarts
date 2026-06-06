// Creates/refreshes a Stripe Connect Express account for the seller and returns an onboarding link.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");
    const { data: userData, error: uErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (uErr) throw uErr;
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // Check existing
    const { data: existing } = await supabase
      .from("seller_stripe_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    let acctId = existing?.stripe_account_id as string | undefined;

    if (!acctId) {
      const acct = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
      });
      acctId = acct.id;
      await supabase.from("seller_stripe_accounts").insert({
        user_id: user.id,
        stripe_account_id: acctId,
      });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const link = await stripe.accountLinks.create({
      account: acctId!,
      refresh_url: `${origin}/marketplace?connect=refresh`,
      return_url: `${origin}/marketplace?connect=done`,
      type: "account_onboarding",
    });

    // Refresh status
    const acct = await stripe.accounts.retrieve(acctId!);
    await supabase
      .from("seller_stripe_accounts")
      .update({
        charges_enabled: acct.charges_enabled,
        payouts_enabled: acct.payouts_enabled,
        details_submitted: acct.details_submitted,
      })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({ url: link.url, account_id: acctId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
