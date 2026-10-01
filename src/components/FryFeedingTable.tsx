import { useMemo, useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useBatches } from "@/hooks/useFarm";
import { useHatcheryBatches } from "@/hooks/useHatchery";

// Hatchery 21-day fry table: grams of powder feed per feeding, per 5,000 fry.
export const FRY_TABLE_PER_5K = [2, 4, 7, 9, 11, 11, 12, 13, 15, 16, 16, 17, 18, 18, 18, 18, 18, 19, 19, 20, 20];

const fmtG = (g: number) => (g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${Math.round(g)} g`);

interface Source { id: string; label: string; start: string; count: number }

export default function FryFeedingTable() {
  const { data: batches } = useBatches();
  const { data: hatch = [] } = useHatcheryBatches();

  const sources = useMemo<Source[]>(() => {
    const list: Source[] = [];
    hatch.filter((b) => b.status !== "sold").forEach((b) => list.push({
      id: `h-${b.id}`, label: `Fry ${b.batch_code} (${b.pond_stocked})`, start: b.collected_date,
      count: b.total_graded > 0 ? b.restocked_amount : b.total_collection,
    }));
    (batches ?? []).filter((b: any) => b.status !== "harvested" && b.current_count > 0).forEach((b: any) => list.push({
      id: `b-${b.id}`, label: `${b.name}${b.pond ? ` (${b.pond})` : ""}`, start: b.stock_date, count: b.current_count,
    }));
    return list;
  }, [batches, hatch]);

  const [sourceId, setSourceId] = useState("");
  const [customCount, setCustomCount] = useState(5000);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [feedings, setFeedings] = useState(5);

  const src = sources.find((s) => s.id === sourceId);
  const count = src ? src.count : customCount;
  const day = src ? differenceInCalendarDays(new Date(date), new Date(src.start)) + 1 : null;
  const factor = count / 5000;
  const perFeed = day && day >= 1 && day <= 21 ? FRY_TABLE_PER_5K[day - 1] * factor : 0;

  return (
    <div className="bg-card rounded-2xl p-3 shadow-card">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
        <CalendarDays className="w-4 h-4 text-primary" /> Fry feeding table (21 days, powder feed)
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}
          className="col-span-2 bg-muted/50 border border-border rounded-lg px-2 py-2 text-xs">
          <option value="">Enter number of fry manually</option>
          {sources.map((s) => <option key={s.id} value={s.id}>{s.label} · {s.count.toLocaleString()} fry</option>)}
        </select>
        {!src && (
          <label className="text-[10px] text-muted-foreground">Number of fry
            <input type="number" min={1} value={customCount} onChange={(e) => setCustomCount(Math.max(1, Number(e.target.value) || 1))}
              className="w-full mt-0.5 bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground" />
          </label>
        )}
        {src && (
          <label className="text-[10px] text-muted-foreground">Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full mt-0.5 bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground" />
          </label>
        )}
        <label className="text-[10px] text-muted-foreground">Feedings per day
          <input type="number" min={1} max={10} value={feedings} onChange={(e) => setFeedings(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
            className="w-full mt-0.5 bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground" />
        </label>
      </div>

      {src && (
        <div className="mt-3 rounded-xl bg-primary/10 border border-primary/20 p-3">
          {day && day >= 1 && day <= 21 ? (
            <>
              <p className="text-[11px] text-muted-foreground">{format(new Date(date), "dd MMM yyyy")} · Day {day} of 21</p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div><p className="text-lg font-bold text-primary">{fmtG(perFeed)}</p><p className="text-[10px] text-muted-foreground">each feeding</p></div>
                <div><p className="text-lg font-bold text-primary">{fmtG(perFeed * feedings)}</p><p className="text-[10px] text-muted-foreground">total for the day ({feedings}×)</p></div>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {day !== null && day < 1 ? "This date is before the batch was stocked." : `Day ${day}: past the 21-day fry period — switch to pellet feed by body weight.`}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-border/50">
        <table className="w-full text-[11px]">
          <thead className="bg-muted/60 sticky top-0">
            <tr className="text-muted-foreground">
              <th className="text-left px-2 py-1.5">Day</th>
              <th className="text-right px-2 py-1.5">Per feeding</th>
              <th className="text-right px-2 py-1.5">Per day</th>
            </tr>
          </thead>
          <tbody>
            {FRY_TABLE_PER_5K.map((g, i) => {
              const pf = g * factor;
              const active = day === i + 1;
              return (
                <tr key={i} className={active ? "bg-primary/15 font-semibold text-primary" : "text-foreground border-t border-border/30"}>
                  <td className="px-2 py-1">{i + 1}</td>
                  <td className="px-2 py-1 text-right">{fmtG(pf)}</td>
                  <td className="px-2 py-1 text-right">{fmtG(pf * feedings)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">For {count.toLocaleString()} fry · based on the hatchery table (grams per 5,000 fry per feeding).</p>
    </div>
  );
}
