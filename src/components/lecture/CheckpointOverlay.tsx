import { useState } from "react";
import type { VideoCheckpoint } from "@/hooks/useVideoCheckpoints";

interface Props {
  checkpoint: VideoCheckpoint;
  onDismiss: () => void;
}

type State = "asking" | "correct" | "wrong";

export function CheckpointOverlay({ checkpoint, onDismiss }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [state, setState] = useState<State>("asking");

  const handleSelect = (idx: number) => {
    if (state !== "asking") return;
    setSelected(idx);
    const isCorrect = idx === checkpoint.correctIndex;
    setState(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setTimeout(onDismiss, 1200);
    }
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-[200]"
      style={{
        background: "rgba(13,17,23,0.97)",
        borderTop: "3px solid #F59E0B",
        animation: "slideUp 300ms ease-out",
      }}
    >
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}
          >
            ⏸ Quick Check
          </span>
          {state !== "asking" && (
            <button onClick={onDismiss} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: "rgba(72,79,88,0.2)", color: "#8B949E", border: "1px solid #30363D" }}>✕ Close</button>
          )}
        </div>

        <p className="text-sm font-semibold mb-3" style={{ color: "#E6EDF3" }}>{checkpoint.questionText}</p>

        <div className="space-y-2">
          {checkpoint.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === checkpoint.correctIndex;
            const showResult = state !== "asking";
            let bg = "#21262D", border = "#30363D", color = "#E6EDF3";
            if (showResult && isCorrect) { bg = "rgba(34,197,94,0.15)"; border = "#22C55E"; color = "#22C55E"; }
            else if (showResult && isSelected && !isCorrect) { bg = "rgba(239,68,68,0.15)"; border = "#EF4444"; color = "#EF4444"; }
            else if (!showResult && isSelected) { bg = "rgba(249,115,22,0.15)"; border = "#F97316"; }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={state !== "asking"}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{ background: bg, border: `1px solid ${border}`, color }}
              >
                {showResult && isCorrect ? "✅ " : showResult && isSelected && !isCorrect ? "❌ " : ""}
                {opt}
              </button>
            );
          })}
        </div>

        {state === "wrong" && (
          <div className="mt-3 p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-xs" style={{ color: "#8B949E" }}>
              The correct concept here is: <span style={{ color: "#E6EDF3" }}>{checkpoint.explanation}</span>
            </p>
            <button
              onClick={onDismiss}
              className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(249,115,22,0.15)", color: "#F97316", border: "1px solid rgba(249,115,22,0.3)" }}
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
