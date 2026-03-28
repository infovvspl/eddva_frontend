interface Props {
  watchPct: number;
  isRevisionMode: boolean;
  mockTestId?: string | null;
  onTakeQuiz: () => void;
}

export function WatchProgressBar({ watchPct, isRevisionMode, mockTestId, onTakeQuiz }: Props) {
  const pct = Math.min(100, Math.round(watchPct));
  const quizUnlocked = pct >= 90;
  const color = isRevisionMode ? "#22C55E" : "#F97316";
  const remaining = Math.max(0, 90 - pct);

  return (
    <div className="px-5 py-3 border-t" style={{ borderColor: "#30363D" }}>
      {/* Bar row */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: "#8B949E" }}>Watch Progress</span>
        <span className="text-xs font-bold" style={{ color }}>{pct}% watched</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#21262D" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>

      {/* Unlock message */}
      {!isRevisionMode && (
        <div className="mt-2 flex items-center gap-3">
          {!quizUnlocked ? (
            <p className="text-xs" style={{ color: "#F59E0B" }}>
              ⚡ Watch {remaining}% more to unlock the topic quiz
            </p>
          ) : (
            <div className="flex items-center gap-3 flex-1">
              <p className="text-xs" style={{ color: "#22C55E" }}>✅ Quiz unlocked! You can now take the topic quiz.</p>
              {mockTestId && (
                <button
                  onClick={onTakeQuiz}
                  className="text-xs font-bold px-3 py-1 rounded-lg transition-colors"
                  style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)" }}
                >
                  Take Quiz Now →
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {isRevisionMode && (
        <p className="text-xs mt-2" style={{ color: "#484F58" }}>Revision watch — quiz already completed ✓</p>
      )}
    </div>
  );
}
