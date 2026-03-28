import { useState } from "react";

interface Props {
  name: string;
  latex: string;
  description: string;
}

export function FormulaCard({ name, latex, description }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: "#21262D", border: "1px solid #30363D" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "#8B949E" }}>{name}</span>
        <button
          onClick={handleCopy}
          className="text-xs px-2.5 py-1 rounded transition-all"
          style={{
            background: copied ? "rgba(34,197,94,0.15)" : "transparent",
            color: copied ? "#22C55E" : "#8B949E",
            border: "1px solid " + (copied ? "rgba(34,197,94,0.3)" : "#30363D"),
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div
        className="text-center py-3 font-mono text-lg"
        style={{ color: "#E6EDF3", background: "#161B22", borderRadius: "8px" }}
        dangerouslySetInnerHTML={{
          __html: (() => {
            try {
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              const katex = require("katex");
              return katex.renderToString(latex, { displayMode: true, throwOnError: false });
            } catch {
              return `<span style="font-family:monospace">${latex}</span>`;
            }
          })()
        }}
      />
      {description && (
        <p className="text-xs leading-5" style={{ color: "#484F58" }}>{description}</p>
      )}
    </div>
  );
}
