import { FormulaCard } from "./FormulaCard";

interface Formula {
  name: string;
  latex: string;
  description: string;
}

interface Props {
  formulas: Formula[];
}

export function FormulasTab({ formulas }: Props) {
  if (formulas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-3" style={{ opacity: 0.3 }}>📐</span>
        <p className="text-sm font-medium" style={{ color: "#8B949E" }}>No formulas extracted for this lecture</p>
        <p className="text-xs mt-1" style={{ color: "#484F58" }}>Formulas are auto-extracted by AI when available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto h-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold text-sm" style={{ color: "#E6EDF3" }}>📐 Formulas</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(168,85,247,0.15)", color: "#A855F7", border: "1px solid rgba(168,85,247,0.3)" }}>
          ✨ AI extracted
        </span>
      </div>
      {formulas.map((f, i) => (
        <FormulaCard key={i} name={f.name} latex={f.latex} description={f.description} />
      ))}
    </div>
  );
}
