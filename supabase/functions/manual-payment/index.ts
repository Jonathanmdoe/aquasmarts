// Manual mobile-money payments (Vodacom M-Pesa Lipa Namba).
// Buyer pays to the business number, submits the M-Pesa confirmation code,
// and a platform admin approves or rejects it.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICES_TZS: Record<string, number> = { pro: 79000, enterprise: 259000 };
const PLATFORM_FEE_RATE = 0.035;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const normalizeMsisdn = (raw: string) => {
  const d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("255")) return d;
  if (d.startsWith("0")) return `255${d.slice(1)}`;
  if (d.length === 9) return `255${d}`;
  return d;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData.user;
    if (!user) return json({ error: "Not authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    const isAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();
      return !!data;
    };

    if (action === "config") {
      const { data } = await supabase
        .from("platform_settings")
        .select("mpesa_number, mpesa_account_name")
        .eq("id", 1)
        .maybeSingle();
      return json({
        mpesa_number: data?.mpesa_number || "",
        mpesa_account_name: data?.mpesa_account_name || "AquaSmart",
      });
    }

    if (action === "status") {
      const reference = String(body.reference || "");
      const { data } = await supabase
        .from("payment_transactions")
        .select("status, user_id")
        .eq("reference", reference)
        .maybeSingle();
      if (!data || data.user_id !== user.id) return json({ error: "Not found" }, 404);
      return json({ status: data.status });
    }

    if (action === "submit") {
      const purpose = String(body.purpose || "");
      const code = String(body.code || "").trim().toUpperCase();
      const phone = normalizeMsisdn(String(body.phone || ""));

      if (!["subscription", "marketplace"].includes(purpose)) {
        return json({ error: "purpose must be 'subscription' or 'marketplace'" }, 400);
      }
      if (code.length < 6 || code.length > 32) {
        return json({ error: "Enter the M-Pesa confirmation code from your SMS" }, 400);
      }
      if (!/^255\d{9}$/.test(phone)) {
        return json({ error: "Enter a valid Tanzanian phone number, e.g. 0712345678" }, 400);
      }

      const { data: dupe } = await supabase
        .from("payment_transactions")
        .select("id")
        .eq("provider_ref", code)
        .maybeSingle();
      if (dupe) return json({ error: "This confirmation code has already been submitted" }, 400);

      const reference = `AQS${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
      let amountTzs = 0;
      let plan: string | null = null;
      let relatedId: string | null = null;

      if (purpose === "subscription") {
        plan = String(body.plan || "");
        amountTzs = PLAN_PRICES_TZS[plan] ?? 0;
        if (!amountTzs) return json({ error: "Unknown plan" }, 400);
      } else {
        const { data: cart, error: cartErr } = await supabase
          .from("marketplace_cart_items")
          .select("id, quantity, listing:marketplace_listings(id,title,price,user_id)")
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
        relatedId = inserted?.[0]?.id ?? null;
        await supabase.from("marketplace_cart_items").delete().eq("user_id", user.id);
      }

      const { error: txErr } = await supabase.from("payment_transactions").insert({
        user_id: user.id,
        purpose,
        plan,
        reference,
        related_id: relatedId,
        amount_tzs: amountTzs,
        phone,
        channel: "mobile_money",
        provider: "mpesa_manual",
        provider_ref: code,
        status: "pending_review",
      });
      if (txErr) throw txErr;

      return json({ reference, amount_tzs: amountTzs, status: "pending_review" });
    }

    if (action === "list") {
      if (!(await isAdmin())) return json({ error: "Forbidden — super_admin required" }, 403);
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("provider", "mpesa_manual")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      const userIds = [...new Set((data ?? []).map((t: any) => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
      const byUser = Object.fromEntries((profiles ?? []).map((p: any) => [p.user_id, p]));
      return json({
        payments: (data ?? []).map((t: any) => ({ ...t, profile: byUser[t.user_id] ?? null })),
      });
    }

    if (action === "review") {
      if (!(await isAdmin())) return json({ error: "Forbidden — super_admin required" }, 403);
      const id = String(body.id || "");
      const decision = body.decision === "approve" ? "approve" : "reject";
      const note = body.note ? String(body.note).slice(0, 500) : null;

      const { data: tx } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!tx) return json({ error: "Payment not found" }, 404);
      if (tx.status !== "pending_review") return json({ error: "Already reviewed" }, 400);

      const status = decision === "approve" ? "paid" : "failed";
      await supabase
        .from("payment_transactions")
        .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_note: note })
        .eq("id", id);

      if (decision === "approve") {
        if (tx.purpose === "subscription" && tx.plan) {
          await supabase
            .from("subscribers_cache")
            .upsert({ user_id: tx.user_id, plan: tx.plan, subscribed: true }, { onConflict: "user_id" });
        } else if (tx.purpose === "marketplace") {
          await supabase
            .from("marketplace_orders")
            .update({ payment_status: "paid", status: "confirmed" })
            .eq("stripe_session_id", tx.reference);
        }
      } else if (tx.purpose === "marketplace") {
        await supabase
          .from("marketplace_orders")
          .update({ payment_status: "failed", status: "cancelled" })
          .eq("stripe_session_id", tx.reference);
      }

      await supabase.from("notifications").insert({
        user_id: tx.user_id,
        type: "payment",
        title: decision === "approve" ? "Payment confirmed" : "Payment rejected",
        body:
          decision === "approve"
            ? `Your payment of TZS ${Number(tx.amount_tzs).toLocaleString()} was confirmed.`
            : `Your payment of TZS ${Number(tx.amount_tzs).toLocaleString()} could not be verified.${note ? ` ${note}` : ""}`,
        link: tx.purpose === "subscription" ? "/subscription" : "/marketplace",
      });

      return json({ ok: true, status });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("manual-payment error:", msg);
    return json({ error: msg }, 500);
  }
});
