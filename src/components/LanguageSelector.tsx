import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { INDIAN_LANGUAGES, storeLanguage } from "@/lib/api/sarvam";

interface Props {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export function LanguageSelector({ value, onChange, className }: Props) {
  const handleChange = (code: string) => {
    storeLanguage(code);
    onChange(code);
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="text-xs bg-black/30 border border-white/15 rounded-lg px-2 py-1 text-foreground/80 focus:outline-none focus:border-primary/50 cursor-pointer"
      >
        {INDIAN_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-[#0d0d1a] text-white">
            {lang.native} ({lang.label})
          </option>
        ))}
      </select>
    </div>
  );
}
