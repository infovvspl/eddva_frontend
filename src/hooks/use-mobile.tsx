import * as React from "react";

const MOBILE_BREAKPOINT = 768;
/** Phone + tablet (below Tailwind `lg`) — use to reduce heavy effects on smaller viewports */
const COMPACT_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

/** True for viewports below `lg` (phones and tablets) — for pausing infinite animations, etc. */
export function useIsCompactLayout() {
  const [compact, setCompact] = React.useState(
    () => typeof window !== "undefined" && window.innerWidth < COMPACT_BREAKPOINT
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${COMPACT_BREAKPOINT - 1}px)`);
    const onChange = () => setCompact(window.innerWidth < COMPACT_BREAKPOINT);
    mql.addEventListener("change", onChange);
    setCompact(window.innerWidth < COMPACT_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return compact;
}
