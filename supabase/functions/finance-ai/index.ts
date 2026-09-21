// Streaming Finance AI Advisor using Lovable AI Gateway
//
// SECURITY: this function used to accept any caller holding the public anon key
// (it only forwards client-supplied numbers to a paid AI gateway). It now requires
//   1. a valid signed-in USER session (the anon key carries no user, so it is rejected),
//   2. a `farm_id`, and
//   3. that the user OWNS that farm or is an ACTIVE owner/manager of it.
// The service-role key stays server-side and is only used to verify identity and
// read the farm/membership rows that decide access.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { bearerToken, decideFarmFinanceAccess, FINANCE_AI_MODES, MAX_BODY_BYTES } from "../_shared/authz.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonError = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ---- 1. authenticate: a real user, not just the anon key -----------------
    const token = bearerToken(req.headers.get("Authorization"));
    if (!token) return jsonError("Authentication required", 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) return jsonError("Authentication required", 401);

    // ---- 2. bounded, well-formed body ---------------------------------------
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return jsonError("Request too large", 413);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      return jsonError("Invalid JSON body", 400);
    }
    const { mode, question, context, language } = body as {
      mode: string; question?: string; context: unknown; language?: string;
    };
    if (typeof mode !== "string" || !(FINANCE_AI_MODES as readonly string[]).includes(mode)) {
      return jsonError("Unknown mode", 400);
    }

    // ---- 3. authorize: this user may use financial tooling for THIS farm ----
    const farmId = body.farm_id;
    const { data: farm } = typeof farmId === "string" && farmId
      ? await admin.from("farms").select("id, user_id").eq("id", farmId).maybeSingle()
      : { data: null };
    const { data: membership } = farm
      ? await admin.from("team_members").select("role, is_active").eq("farm_id", farm.id).eq("user_id", user.id).maybeSingle()
      : { data: null };
    const decision = decideFarmFinanceAccess({ userId: user.id, farmId, farm, membership });
    if (!decision.allowed) return jsonError(decision.reason, decision.status);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = typeof language === "string" && language.trim() ? language.trim() : "Swahili (Kiswahili)";
    const isSwahili = lang.toLowerCase().includes("swahili");

    const baseRules = `
LANGUAGE RULES:
- Reply ONLY in ${lang}. This is the language the farmer chose in the app.${isSwahili ? "\n- Andika kwa Kiswahili sanifu na rahisi, kisha toa muhtasari mfupi wa Kiingereza rahisi." : "\n- Add a one-line simple-English summary at the end."}
- Use very simple words and short sentences. No jargon. Explain like talking to a small fish farmer.
- USE TZS (Tanzanian Shillings) ONLY for all money. NEVER use $, USD, KES, or any other currency.
- Format money like: TZS 1,250,000 (no decimals).
- Every recommendation must use real numbers from the farm data.`;

    const systemPrompts: Record<string, string> = {
      full_analysis: `${baseRules}

Wewe ni mshauri wa fedha wa shamba la samaki AquaSmart. Soma data halisi na toa ripoti yenye sehemu hizi (markdown):

## 📊 Afya ya Fedha (Financial Health)
Toa daraja (A–F) na sentensi moja ya Kiswahili + moja ya Kiingereza.

## 💡 Mambo 3 Muhimu (Top 3 Insights)
Bullet 3 — Kiswahili, ikifuatiwa na (EN: ...).

## ⚠️ Gharama Zilizopanda (Cost Anomalies)
Linganisha mwezi huu na uliopita. Onyesha nambari za TZS.

## 🐟 Mapendekezo kwa Batch (Batch Recommendations)
Kwa kila batch, sema cha kufanya wiki hii.

## 💰 Mtiririko wa Pesa wa Siku 30 (30-Day Cash Flow)
Tabiri mapato na matumizi kwa TZS.

## 🎯 Hatua Muhimu Wiki Hii (Priority Action)
Kitu KIMOJA cha kufanya sasa.

Vipimo: faida nzuri 35%, FCR 1.5–1.8, vifo chini ya 10%, gharama ya chakula ~55%.`,
      pnl_analysis: `${baseRules}\nSoma P&L halisi. Toa mapendekezo 3–5 yenye nambari za TZS ya kuongeza faida. Kiswahili + EN summary.`,
      cost_reduction: `${baseRules}\nSoma gharama. Toa njia 3–5 za kupunguza gharama 10–15% bila kuumiza samaki. TZS pekee. Kiswahili + EN.`,
      cash_flow: `${baseRules}\nSoma utabiri. Onyesha siku za upungufu wa pesa, ushauri wa muda wa kuvuna, na uwezo wa kulipa mikopo. TZS.`,
      budget: `${baseRules}\nLinganisha matumizi halisi na bajeti. Pendekeza marekebisho. Onyesha akiba inayowezekana kwa TZS.`,
      tax: `${baseRules}\nUshauri wa kodi kwa nchi husika. Onyesha makato halali, VAT, na mipango ya robo mwaka. TZS pekee.`,
      debt: `${baseRules}\nChambua uwiano wa deni-mapato. Pendekeza mpango wa malipo (avalanche/snowball). Tathmini athari kwa mzunguko wa kuvuna. TZS.`,
      question: `${baseRules}\nJibu swali la mkulima kwa Kiswahili rahisi kisha EN summary fupi. Tumia data halisi. TZS pekee.`,
    };

    const system = systemPrompts[mode] ?? systemPrompts.question;
    const userMessage = mode === "question" && question
      ? `Question: ${question}\n\nData:\n${JSON.stringify(context, null, 2)}`
      : `Real farm data:\n${JSON.stringify(context, null, 2)}${question ? `\n\nFocus: ${question}` : ""}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace billing." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: txt }), {
        status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(resp.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
