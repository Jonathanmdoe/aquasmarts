// Streaming Finance AI Advisor using Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, question, context, language } = await req.json();
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
