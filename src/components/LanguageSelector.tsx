import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { INDIAN_LANGUAGES, storeLanguage } from "@/lib/api/sarvam";
import { CustomSelect } from "@/components/ui/CustomSelect";

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
      <CustomSelect
        value={value}
        options={INDIAN_LANGUAGES.map((lang) => ({ value: lang.code, label: `${lang.native} (${lang.label})` }))}
        className="w-full"
      />
    </div>
  );
}
