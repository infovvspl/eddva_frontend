import { useState } from "react";
import { List, Network } from "lucide-react";
import { cn } from "@/lib/utils";

export type RoadmapView = "map" | "list";

const VIEW_KEY = "planner-roadmap-view";

function readView(): RoadmapView {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "map" || v === "list") return v;
  } catch {
    /* storage unavailable */
  }
  return typeof window !== "undefined" && window.innerWidth < 768 ? "list" : "map";
}

/** Map or list, remembered across the planner's pages (a list by default on a phone). */
export function useRoadmapView(): [RoadmapView, (v: RoadmapView) => void] {
  const [view, setView] = useState<RoadmapView>(readView);
  const choose = (v: RoadmapView) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* storage unavailable */
    }
  };
  return [view, choose];
}

export function ViewToggle({ view, onChange }: { view: RoadmapView; onChange: (v: RoadmapView) => void }) {
  return (
    <div className="flex rounded-xl border border-border p-0.5" role="group" aria-label="Roadmap view">
      {(["map", "list"] as const).map((v) => (
        <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={view === v}
          className={cn("inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
        >
          {v === "map" ? <Network className="size-3.5" /> : <List className="size-3.5" />}
          {v === "map" ? "Map" : "List"}
        </button>
      ))}
    </div>
  );
}
