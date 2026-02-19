import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { batches, waterReadings, feedingLogs, financials } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are AquaSmart AI, an expert aquaculture advisor for fish farmers in Tanzania. 
Analyze the farm data provided and give actionable predictions and recommendations in this JSON format:
{
  "harvest_prediction": { "ready": boolean, "estimated_days": number, "confidence": string, "reasoning": string },
  "feeding_recommendation": { "adjust": string, "amount_change_pct": number, "reasoning": string },
  "water_quality_alert": { "status": string, "concerns": [string], "actions": [string] },
  "growth_forecast": { "current_trend": string, "projected_biomass_30d": number, "reasoning": string },
  "cost_optimization": { "tip": string, "potential_saving_pct": number }
}
Keep responses practical for Tanzanian fish farmers. Use TZS for any monetary references. Be concise.`;

    const userPrompt = `Farm data summary:
- Active batches: ${JSON.stringify(batches ?? [])}
- Latest water readings: ${JSON.stringify(waterReadings ?? [])}
- Recent feeding logs: ${JSON.stringify(feedingLogs ?? [])}
- Financial summary: ${JSON.stringify(financials ?? [])}

Provide AI predictions and recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";

    // Try to parse JSON from content
    let predictions;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      predictions = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      predictions = { raw: content };
    }

    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-predictions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
