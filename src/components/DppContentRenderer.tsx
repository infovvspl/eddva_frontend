import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type McqOption = { label: string; text: string };

type Block =
  | { kind: "title";    text: string }
  | { kind: "section";  text: string }
  | { kind: "meta";     text: string }
  | { kind: "mcq";      n: number; q: string; opts: McqOption[] }
  | { kind: "numbered"; n: number; text: string }
  | { kind: "text";     text: string }
  | { kind: "hr" };

// ─── Parser ───────────────────────────────────────────────────────────────────

function findOptionStart(text: string): number {
  const re = /(?<![A-Za-z])([A-D])[.)]\s/g;
  const hits: { label: string; idx: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    hits.push({ label: m[1], idx: m.index });
  }
  for (let i = 0; i < hits.length - 1; i++) {
    const a = hits[i].label, b = hits[i + 1].label;
    if ((a === "A" && b === "B") || (a === "B" && b === "C")) {
      return hits[i].idx;
    }
  }
  return -1;
}

function extractOptions(optStr: string): McqOption[] {
  const opts: McqOption[] = [];
  const re = /([A-D])[.)]\s+(.+?)(?=\s+[A-D][.)]|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(optStr)) !== null) {
    opts.push({ label: m[1], text: m[2].trim() });
  }
  return opts;
}

function parseBlocks(raw: string): Block[] {
  const blocks: Block[] = [];

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const plain = line.replace(/\*\*/g, "").replace(/^#+\s*/, "");

    // Title (single #)
    if (/^#\s/.test(line) && !/^##/.test(line)) {
      blocks.push({ kind: "title", text: plain });
      continue;
    }

    // Section header (## / ### / **Section / **Part / **Answer Key)
    if (/^#{2,}\s/.test(line) || /^\*\*(Section|Part|Answer Key|Instructions?)/i.test(line)) {
      blocks.push({ kind: "section", text: plain });
      continue;
    }

    // Divider
    if (/^-{3,}$/.test(line)) {
      blocks.push({ kind: "hr" });
      continue;
    }

    // Numbered item
    const qm = line.match(/^(\d+)[.)]\s+(.+)/);
    if (qm) {
      const n = parseInt(qm[1]);
      const rest = qm[2].replace(/\*\*/g, "");

      const optStart = findOptionStart(rest);
      if (optStart > 0) {
        const questionText = rest.slice(0, optStart).trim().replace(/[:\s—\-]+$/, "");
        const opts = extractOptions(rest.slice(optStart));
        if (opts.length >= 2) {
          blocks.push({ kind: "mcq", n, q: questionText, opts });
          continue;
        }
      }

      blocks.push({ kind: "numbered", n, text: rest });
      continue;
    }

    // Meta line (Subject: Chapter: etc.)
    if (/^(Subject|Chapter|Date|Class|Time|Topic)\s*[:]/i.test(plain)) {
      blocks.push({ kind: "meta", text: plain });
      continue;
    }

    blocks.push({ kind: "text", text: plain });
  }

  return blocks;
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

const OPTION_COLORS: Record<string, string> = {
  A: "bg-blue-50 border-blue-200 text-blue-700",
  B: "bg-emerald-50 border-emerald-200 text-emerald-700",
  C: "bg-amber-50 border-amber-200 text-amber-700",
  D: "bg-rose-50 border-rose-200 text-rose-700",
};

export default function DppContentRenderer({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2.5 text-left">
      {blocks.map((block, i) => {
        if (block.kind === "title") {
          return (
            <h1 key={i} className="text-xl font-black text-slate-900 pb-3 border-b-2 border-orange-400 mb-4">
              {block.text}
            </h1>
          );
        }

        if (block.kind === "section") {
          return (
            <div key={i} className="mt-6 mb-3 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm tracking-wide">
              {block.text}
            </div>
          );
        }

        if (block.kind === "meta") {
          return (
            <p key={i} className="text-xs text-slate-500 font-semibold tracking-wide">
              {block.text}
            </p>
          );
        }

        if (block.kind === "hr") {
          return <hr key={i} className="border-slate-200 my-4" />;
        }

        if (block.kind === "mcq") {
          return (
            <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              {/* Question header */}
              <div className="flex gap-3 p-4 pb-3 bg-slate-50/80 border-b border-slate-100">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                  {block.n}
                </span>
                <p className="text-slate-900 text-sm font-semibold leading-relaxed pt-0.5">
                  {block.q}
                </p>
              </div>
              {/* Options */}
              <div className="grid grid-cols-2 gap-2 p-3">
                {block.opts.map(opt => (
                  <div
                    key={opt.label}
                    className={cn(
                      "flex items-start gap-2 p-2.5 rounded-xl border",
                      OPTION_COLORS[opt.label] ?? "bg-slate-50 border-slate-200 text-slate-700"
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 border bg-white",
                      OPTION_COLORS[opt.label] ?? ""
                    )}>
                      {opt.label}
                    </span>
                    <span className="text-xs leading-relaxed font-medium">{opt.text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (block.kind === "numbered") {
          return (
            <div key={i} className="flex gap-3 py-2.5 border-b border-slate-100 last:border-0">
              <span className="text-[11px] font-black text-indigo-500 w-6 text-right shrink-0 mt-0.5">
                {block.n}.
              </span>
              <p className="text-sm text-slate-700 leading-relaxed">{block.text}</p>
            </div>
          );
        }

        if (block.kind === "text" && block.text) {
          return (
            <p key={i} className="text-sm text-slate-600 leading-relaxed px-1">
              {block.text}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
