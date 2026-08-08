import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Brain, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n";

interface Props {
  mode: string;
  context: Record<string, any>;
  label: string;
  question?: string;
  compact?: boolean;
}

export function AIAdvisorButton({ mode, context, label, question, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState("");
  const { toast } = useToast();
  const { langName } = useI18n();

  const run = async () => {
    setOpen(true); setText(""); setStreaming(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-ai`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ mode, context, question, language: langName }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "AI request failed" }));
        toast({ title: "AI unavailable", description: err.error, variant: "destructive" });
        setStreaming(false); return;
      }
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const ln of lines) {
          if (!ln.startsWith("data: ")) continue;
          const data = ln.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) setText(t => t + delta);
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      <button onClick={run}
        className={compact
          ? "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
          : "w-full inline-flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl gradient-ocean text-primary-foreground shadow-card"}>
        <Sparkles className="w-4 h-4" /> {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => !streaming && setOpen(false)}>
          <div className="bg-card w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl gradient-ocean flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">AI Finance Advisor</h3>
                  <p className="text-[10px] text-muted-foreground">Powered by Lovable AI · Real data</p>
                </div>
              </div>
              <button onClick={() => !streaming && setOpen(false)} className="text-muted-foreground text-xl px-2">×</button>
            </div>
            {streaming && !text && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Analysing your real data…
              </div>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground text-sm">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
            {!streaming && text && (
              <button onClick={run} className="mt-4 w-full text-xs font-medium py-2 rounded-lg bg-muted text-foreground">
                Re-analyse
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
