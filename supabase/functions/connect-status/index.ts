// Refreshes the cached Stripe Connect status for the current seller.
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
    const { data: userData } = await supabase.auth.getUser((req.headers.get("Authorization") || "").replace("Bearer ", ""));
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const { data: row } = await supabase.from("seller_stripe_accounts").select("*").eq("user_id", user.id).maybeSingle();
    if (!row?.stripe_account_id) {
      return new Response(JSON.stringify({ connected: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const acct = await stripe.accounts.retrieve(row.stripe_account_id);
    await supabase
      .from("seller_stripe_accounts")
      .update({
        charges_enabled: acct.charges_enabled,
        payouts_enabled: acct.payouts_enabled,
        details_submitted: acct.details_submitted,
      })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({
      connected: true,
      charges_enabled: acct.charges_enabled,
      payouts_enabled: acct.payouts_enabled,
      details_submitted: acct.details_submitted,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
