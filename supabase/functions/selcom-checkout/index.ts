// Creates a Selcom (Tanzania) payment in TZS for either a subscription upgrade
// or a marketplace cart, and triggers the mobile-money USSD push.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { selcomRequest, vendorId, normalizeMsisdn } from "../_shared/selcom.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICES_TZS: Record<string, number> = {
  pro: 79000,
  enterprise: 259000,
};

const PLATFORM_FEE_RATE = 0.035;

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
    if (!user?.email) return json({ error: "Not authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const purpose = String(body.purpose || "");
    const channel = body.channel === "card" ? "card" : "mobile_money";
    const phone = normalizeMsisdn(String(body.phone || ""));
    const buyerName = String(body.buyer_name || user.email).slice(0, 60);

    if (!["subscription", "marketplace"].includes(purpose)) {
      return json({ error: "purpose must be 'subscription' or 'marketplace'" }, 400);
    }
    if (channel === "mobile_money" && !/^255\d{9}$/.test(phone)) {
      return json({ error: "Enter a valid Tanzanian phone number, e.g. 0712345678" }, 400);
    }

    const origin = req.headers.get("origin") || "https://aquasmarts.lovable.app";
    const reference = `AQS${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

    let amountTzs = 0;
    let plan: string | null = null;
    let itemsCount = 1;
    let remarks = "";
    let orderIds: string[] = [];

    if (purpose === "subscription") {
      plan = String(body.plan || "");
      amountTzs = PLAN_PRICES_TZS[plan] ?? 0;
      if (!amountTzs) return json({ error: "Unknown plan" }, 400);
      remarks = `AquaSmart ${plan} plan`;
    } else {
      const { data: cart, error: cartErr } = await supabase
        .from("marketplace_cart_items")
        .select("id, quantity, listing:marketplace_listings(id,title,price,user_id,unit)")
        .eq("user_id", user.id);
      if (cartErr) throw cartErr;
      if (!cart || cart.length === 0) return json({ error: "Cart is empty" }, 400);

      const groups: Record<string, any[]> = {};
      for (const item of cart as any[]) {
        (groups[item.listing.user_id as string] ||= []).push(item);
      }
      const sellerId = Object.keys(groups)[0];
      const items = groups[sellerId];

      amountTzs = items.reduce(
        (s: number, i: any) => s + Math.round(Number(i.listing.price) * Number(i.quantity)),
        0,
      );
      itemsCount = items.length;
      remarks = `Marketplace order (${itemsCount} item(s))`;

      const orderRows = items.map((i: any) => {
        const qty = Number(i.quantity) || 0;
        const unit = Math.round(Number(i.listing.price) || 0);
        const sub = unit * qty;
        return {
          buyer_id: user.id,
          seller_id: sellerId,
          listing_id: i.listing.id,
          listing_title: i.listing.title,
          unit_price: unit,
          quantity: qty,
          subtotal: sub,
          platform_fee: Math.round(sub * PLATFORM_FEE_RATE),
          total: sub,
          delivery_type: body.delivery_type || "standard",
          delivery_address: body.delivery_address ?? null,
          payment_status: "pending",
          stripe_session_id: reference,
        };
      });
      const { data: inserted, error: insErr } = await supabase
        .from("marketplace_orders")
        .insert(orderRows)
        .select("id");
      if (insErr) throw insErr;
      orderIds = (inserted ?? []).map((o: any) => o.id);
      await supabase.from("marketplace_cart_items").delete().eq("user_id", user.id);
    }

    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/selcom-webhook`;

    const created = await selcomRequest<any>("/checkout/create-order-minimal", "POST", {
      vendor: vendorId(),
      order_id: reference,
      buyer_email: user.email,
      buyer_name: buyerName,
      buyer_phone: phone || "255000000000",
      amount: amountTzs,
      currency: "TZS",
      redirect_url: btoa(`${origin}/payment-success?ref=${reference}`),
      cancel_url: btoa(`${origin}/payment-canceled?ref=${reference}`),
      webhook: btoa(webhookUrl),
      buyer_remarks: remarks,
      merchant_remarks: remarks,
      no_of_items: itemsCount,
    });

    const resultCode = created.body?.resultcode;
    if (!created.ok || (resultCode && resultCode !== "000")) {
      return json(
        { error: created.body?.message || "Selcom rejected the order", details: created.body },
        created.ok ? 400 : created.status,
      );
    }

    const paymentUrl = created.body?.data?.[0]?.payment_gateway_url
      ? atob(created.body.data[0].payment_gateway_url)
      : null;

    let pushSent = false;
    let pushMessage: string | null = null;

    if (channel === "mobile_money") {
      const wallet = await selcomRequest<any>("/checkout/wallet-payment", "POST", {
        transid: reference,
        order_id: reference,
        msisdn: phone,
      });
      pushSent = wallet.ok && wallet.body?.resultcode === "000";
      pushMessage = wallet.body?.message ?? null;
      if (!pushSent) {
        return json(
          { error: pushMessage || "Could not send the mobile money request", details: wallet.body },
          400,
        );
      }
    }

    await supabase.from("payment_transactions").insert({
      user_id: user.id,
      purpose,
      plan,
      reference,
      related_id: orderIds[0] ?? null,
      amount_tzs: amountTzs,
      phone: phone || null,
      channel,
      selcom_transid: reference,
      payment_url: paymentUrl,
      status: "pending",
      raw: created.body,
    });

    return json({
      reference,
      amount_tzs: amountTzs,
      channel,
      push_sent: pushSent,
      message: pushSent
        ? "Check your phone and enter your mobile money PIN to approve the payment."
        : null,
      payment_url: paymentUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("selcom-checkout error:", msg);
    return json({ error: msg }, 500);
  }
});
