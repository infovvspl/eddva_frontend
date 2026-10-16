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
  /**
   * Overrides navigation entirely (e.g. stepping back a level in an
   * in-page drill-down — class → section → form — rather than changing
   * route). When passed, `to`/`fallback`/history are not used.
   */
  onClick?: () => void;
  /** Replaces the default "Back" label (e.g. "Back to Classes"). */
  label?: string;
}

export const BackButton = ({
  to,
  fallback = "/",
  confirmMessage,
  onBeforeLeave,
  onClick,
  label = "Back",
  className = "",
  ...rest
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onBeforeLeave && !onBeforeLeave()) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    if (onClick) {
      onClick();
      return;
    }
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
      className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-blue-600/20 hover:brightness-110 transition-all shrink-0 ${className}`}
      {...rest}
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </button>
  );
};
