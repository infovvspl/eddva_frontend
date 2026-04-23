import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const STORAGE_KEY = "eddva_cookie_consent_v1";

export function CookieConsentBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-0 left-0 right-0 z-[55] border-t border-gray-200 bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] shadow-[0_-8px_32px_rgba(15,23,42,0.08)] sm:px-6 supports-[backdrop-filter]:md:bg-white/95 supports-[backdrop-filter]:md:backdrop-blur-md"
    >
      <div className="landing-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-gray-600 sm:max-w-[min(52rem,75%)] pr-2">
          We use essential cookies to run the app (e.g. sign-in) and, with your choice, to improve the experience.{" "}
          <Link to="/cookie-policy" className="font-semibold text-blue-600 hover:underline">
            Cookie policy
          </Link>
        </p>
        <div className="flex flex-shrink-0 items-center gap-2 sm:pl-4">
          <button
            type="button"
            onClick={accept}
            className="rounded-xl bg-gray-900 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-gray-800"
          >
            OK
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
