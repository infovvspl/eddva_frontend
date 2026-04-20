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
        <span className="text-4xl mb-3 opacity-30">📐</span>
        <p className="text-sm font-medium text-slate-400">No formulas extracted for this lecture</p>
        <p className="text-xs mt-1 text-slate-300">Formulas are auto-extracted by AI when available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold text-sm text-slate-800">📐 Formulas</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200">
          ✨ AI extracted
        </span>
      </div>
      {formulas.map((f, i) => (
        <FormulaCard key={i} name={f.name} latex={f.latex} description={f.description} />
      ))}
    </div>
  );
}
