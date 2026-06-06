// Creates a Stripe Checkout session for a marketplace cart with 3.5% platform fee
// split via Stripe Connect (destination charge). Persists pending orders before redirect.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_FEE_RATE = 0.035;

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
    if (!user?.email) throw new Error("Not authenticated");

    const body = await req.json().catch(() => ({}));
    const deliveryType: string = body.delivery_type || "standard";
    const deliveryAddress: string | null = body.delivery_address ?? null;

    // Load cart
    const { data: cart, error: cartErr } = await supabase
      .from("marketplace_cart_items")
      .select("id, quantity, listing:marketplace_listings(id,title,price,user_id,unit)")
      .eq("user_id", user.id);
    if (cartErr) throw cartErr;
    if (!cart || cart.length === 0) throw new Error("Cart is empty");

    // For simplicity, single-seller checkout: group by seller; if multiple sellers, take first.
    type CartRow = typeof cart[number];
    const sellerGroups: Record<string, CartRow[]> = {};
    for (const item of cart as any[]) {
      const sid = item.listing.user_id as string;
      (sellerGroups[sid] ||= []).push(item);
    }
    const sellerId = Object.keys(sellerGroups)[0];
    const items = sellerGroups[sellerId];

    // Look up seller Stripe Connect
    const { data: stripeAcct } = await supabase
      .from("seller_stripe_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("user_id", sellerId)
      .maybeSingle();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // Build line items
    const lineItems = items.map((i: any) => ({
      price_data: {
        currency: "usd", // TZS not supported by Stripe Checkout; UI shows TZS, charge in USD-equivalent integer cents
        product_data: { name: i.listing.title, description: `${i.listing.unit || ""} x ${i.quantity}` },
        unit_amount: Math.round(Number(i.listing.price) * 100),
      },
      quantity: i.quantity,
    }));

    const subtotal = items.reduce((s: number, i: any) => s + Number(i.listing.price) * i.quantity, 0);
    const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE * 100); // cents

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems,
      customer_email: user.email,
      success_url: `${origin}/marketplace?tab=orders&checkout=success`,
      cancel_url: `${origin}/marketplace?tab=orders&checkout=cancel`,
      metadata: { buyer_id: user.id, seller_id: sellerId, delivery_type: deliveryType },
    };

    // If seller has connected account, use destination charges
    if (stripeAcct?.stripe_account_id && stripeAcct.charges_enabled) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: { destination: stripeAcct.stripe_account_id },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Persist orders (one per cart item)
    const orderRows = items.map((i: any) => {
      const sub = Number(i.listing.price) * i.quantity;
      const fee = +(sub * PLATFORM_FEE_RATE).toFixed(2);
      return {
        buyer_id: user.id,
        seller_id: sellerId,
        listing_id: i.listing.id,
        listing_title: i.listing.title,
        unit_price: i.listing.price,
        quantity: i.quantity,
        subtotal: sub,
        platform_fee: fee,
        total: +(sub + 0).toFixed(2), // buyer pays subtotal; fee deducted from seller payout
        delivery_type: deliveryType,
        delivery_address: deliveryAddress,
        stripe_session_id: session.id,
      };
    });
    const { error: insErr } = await supabase.from("marketplace_orders").insert(orderRows);
    if (insErr) throw insErr;

    // Clear cart
    await supabase.from("marketplace_cart_items").delete().eq("user_id", user.id);

    // Notify seller
    await supabase.from("marketplace_notifications").insert({
      user_id: sellerId,
      type: "order_placed",
      title: "New order received",
      body: `${items.length} item(s) ordered`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
