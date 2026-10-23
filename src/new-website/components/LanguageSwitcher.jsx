// LanguageSwitcher.jsx — language dropdown for the public site.
// Choice is persisted by setLanguage() and applied app-wide through i18next.
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown, Check } from "lucide-react";
import { SUPPORTED_LANGUAGES, setLanguage } from "@/i18n";

const LanguageSwitcher = ({ className = "", id = "nw-lang-switch" }) => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = SUPPORTED_LANGUAGES.find(l => l.code === i18n.resolvedLanguage) ?? SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const onDown = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = code => {
    setOpen(false);
    setLanguage(code);
  };

  return (
    <div className={`nw-lang ${className}`} id={id} ref={ref}>
      <button
        type="button"
        className="nw-lang__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.switchTo")}
        onClick={() => setOpen(o => !o)}
      >
        <Globe size={14} strokeWidth={2.2} aria-hidden="true" />
        <span lang={current.code}>{current.native}</span>
        <ChevronDown size={14} strokeWidth={2.4} aria-hidden="true" className="nw-lang__chev" />
      </button>

      {open && (
        <ul className="nw-lang__menu" role="listbox" aria-label={t("language.switchTo")}>
          {SUPPORTED_LANGUAGES.map(({ code, native }) => (
            <li key={code} role="option" aria-selected={code === current.code}>
              <button
                type="button"
                lang={code}
                className={`nw-lang__opt${code === current.code ? " nw-lang__opt--active" : ""}`}
                onClick={() => choose(code)}
              >
                {native}
                {code === current.code && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
