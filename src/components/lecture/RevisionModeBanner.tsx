interface Props {
  bestAccuracy: number;
  passedDaysAgo: number;
}

export function RevisionModeBanner({ bestAccuracy, passedDaysAgo }: Props) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5"
      style={{ background: "rgba(34,197,94,0.08)", borderBottom: "1px solid rgba(34,197,94,0.2)" }}>
      <span className="text-lg">✅</span>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: "#22C55E" }}>
          You passed this topic with {bestAccuracy.toFixed(0)}%
        </p>
        <p className="text-xs" style={{ color: "#8B949E" }}>This is a revision watch — no pressure!</p>
      </div>
      <p className="text-xs" style={{ color: "#484F58" }}>
        Passed {passedDaysAgo} day{passedDaysAgo !== 1 ? "s" : ""} ago
      </p>
    </div>
  );
}
