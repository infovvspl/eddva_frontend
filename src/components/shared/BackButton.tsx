import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ButtonHTMLAttributes } from "react";

interface BackButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** Navigate to this exact route instead of going back through history. */
  to?: string;
  /** Route used when there's no history to go back to (e.g. deep link / PWA launch). */
  fallback?: string;
  /** Shown via window.confirm before leaving; cancel keeps the user on the page. */
  confirmMessage?: string;
  /** Custom guard (e.g. unsaved-changes check). Return false to cancel navigation. */
  onBeforeLeave?: () => boolean;
}

export const BackButton = ({
  to,
  fallback = "/",
  confirmMessage,
  onBeforeLeave,
  className = "",
  ...rest
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onBeforeLeave && !onBeforeLeave()) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    if (to) {
      navigate(to);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Go back"
      className={`inline-flex items-center gap-1 h-9 pl-2.5 pr-3.5 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shrink-0 ${className}`}
      {...rest}
    >
      <ChevronLeft className="w-4 h-4" />
      Back
    </button>
  );
};
