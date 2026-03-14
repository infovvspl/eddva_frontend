import { Sparkles } from "lucide-react";

export const AiBadge = ({ label = "AI Generated" }: { label?: string }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-ai/10 text-ai border border-ai/20 rounded-full">
    <Sparkles className="w-3 h-3" />
    {label}
  </span>
);
