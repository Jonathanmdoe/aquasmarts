import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkoutUnitAmount, resolveCheckoutPlan, STRIPE_PRODUCT_BY_PLAN } from "../_shared/subscription.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// The checkout currency. AquaSmart prices plans in Tanzanian Shillings and the
// Admin-set price (`platform_settings.price_*_cents`, stored as TZS x 100 = the
// minor-unit form of a two-decimal currency) is charged as-is. There is
// deliberately NO fallback to another currency: if the Stripe account cannot
// present TZS, Stripe rejects the session and the user sees that error, instead
// of silently being billed a different amount in USD.
const CHECKOUT_CURRENCY = "tzs";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  // Service-role client: used ONLY to read the Admin-set price server-side.
  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Authentication required" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) return jsonResponse({ error: "User not authenticated or email not available" }, 401);
    logStep("User authenticated", { email: user.email });

    const body = await req.json().catch(() => ({}));
    const plan = resolveCheckoutPlan(body);
    if (!plan) {
      // Basic has no Stripe product; only Pro and Enterprise are sold by card.
      return jsonResponse({ error: "Choose the Pro or Enterprise plan for card payment." }, 400);
    }

    // The amount comes ONLY from the Admin-configured price — never from the request.
    const { data: settings } = await admin.from("platform_settings").select("price_pro_cents, price_enterprise_cents").eq("id", 1).maybeSingle();
    const unitAmount = checkoutUnitAmount(settings, plan);
    if (unitAmount === null) {
      return jsonResponse({ error: `The ${plan} plan price has not been configured. Please contact support.` }, 400);
    }
    logStep("Price resolved", { plan, currency: CHECKOUT_CURRENCY, unitAmount });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
    logStep("Customer lookup done", { customerId });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: CHECKOUT_CURRENCY,
          unit_amount: unitAmount,
          recurring: { interval: "month" },
          // Reuse the existing Stripe product so `check-subscription` keeps mapping
          // the subscription back to the right tier by product id.
          product: STRIPE_PRODUCT_BY_PLAN[plan],
        },
      }],
      mode: "subscription",
      subscription_data: { metadata: { plan, currency: CHECKOUT_CURRENCY } },
      success_url: `${origin}/settings?tab=subscription&success=true`,
      cancel_url: `${origin}/settings?tab=subscription&canceled=true`,
    });

    logStep("Checkout session created", { sessionId: session.id, currency: session.currency, amount_total: session.amount_total });

    return jsonResponse({ url: session.url });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return jsonResponse({ error: errorMessage }, 500);
  }
});
