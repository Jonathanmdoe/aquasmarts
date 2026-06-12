// Streaming Finance AI Advisor using Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, question, context } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompts: Record<string, string> = {
      full_analysis: `You are AquaSmart's expert aquaculture CFO advisor. Analyse the farm's REAL financial data and return a structured report in clean markdown with these sections:

## 📊 Financial Health Grade
Give a single letter grade (A-F) with one sentence justification.

## 💡 Top 3 Insights
Bullet list of the 3 most important findings from the real numbers.

## ⚠️ Cost Anomalies
Compare current month vs prior month per category. Call out anything unusual.

## 🐟 Batch Recommendations
Actionable advice per batch based on its real P&L and status.

## 💰 30-Day Cash Flow Outlook
Project the next 30 days using real averages and harvest schedule.

## 🎯 Priority Action
ONE specific action the farmer should take this week.

Use TZS for all amounts. Be specific with numbers. Aquaculture benchmarks: 35% net margin, FCR 1.5-1.8, mortality <10%, feed cost ~55% of total.`,
      pnl_analysis: "You are an aquaculture financial analyst. Read the P&L data and give 3-5 specific, numbered recommendations to improve net profit. Use TZS. Be concrete.",
      cost_reduction: "You are a cost-cutting consultant for fish farms. Read the expense breakdown and give 3-5 specific ways to reduce costs 10-15% without harming fish health. Use TZS.",
      cash_flow: "You are a cash flow advisor. Read the projection and identify cash-tight periods, advise on harvest timing, assess loan repayment capacity. Use TZS.",
      budget: "You are a budget planner. Read the real spending patterns vs budgets and suggest specific adjustments. Identify savings. Give a Priority Action.",
      tax: "You are an aquaculture tax advisor. Give country-specific tax advice, deduction maximisation, VAT cash flow tips, and quarterly planning guidance. Use TZS.",
      debt: "You are a debt advisor. Analyse the debt-to-income ratio, advise on repayment priority (avalanche vs snowball), identify refinancing opportunities, assess impact on harvest cycles. Use TZS.",
      question: "You are AquaSmart's finance advisor. Answer the farmer's question using the REAL data provided. Use TZS. Be specific and actionable.",
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
